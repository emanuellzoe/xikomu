// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {AutoSaveVault} from "../src/AutoSaveVault.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AutoSaveVaultTest is Test {
    AutoSaveVault vault;
    MockERC20 cusd;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address keeper = makeAddr("keeper");

    uint128 constant AMOUNT = 10e18;
    uint64 constant INTERVAL = 1 days;

    event PlanCreated(address indexed user, uint128 amount, uint64 interval, uint64 nextRun);
    event PlanCancelled(address indexed user);
    event Saved(address indexed user, uint128 amount, uint64 nextRun, uint256 newBalance);
    event Withdrawn(address indexed user, uint256 amount);

    function setUp() public {
        cusd = new MockERC20();
        vault = new AutoSaveVault(address(cusd), owner);

        // Fund Alice and let the vault pull from her.
        cusd.mint(alice, 1_000e18);
        vm.prank(alice);
        cusd.approve(address(vault), type(uint256).max);
    }

    // --- helpers ---
    function _createPlan(address user) internal {
        vm.prank(user);
        vault.createPlan(AMOUNT, INTERVAL);
    }

    // ---------------------------------------------------------------------
    // constructor
    // ---------------------------------------------------------------------
    function test_Constructor_SetsImmutables() public view {
        assertEq(address(vault.cusd()), address(cusd));
        assertEq(vault.owner(), owner);
        assertEq(vault.MIN_INTERVAL(), 60);
        assertEq(vault.MAX_INTERVAL(), 365 days);
    }

    function test_Constructor_RevertsOnZeroToken() public {
        vm.expectRevert(AutoSaveVault.ZeroAddress.selector);
        new AutoSaveVault(address(0), owner);
    }

    function test_Constructor_RevertsOnZeroOwner() public {
        // Ownable rejects the zero owner before our body runs.
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0)));
        new AutoSaveVault(address(cusd), address(0));
    }

    // ---------------------------------------------------------------------
    // createPlan
    // ---------------------------------------------------------------------
    function test_CreatePlan_StoresAndEmits() public {
        uint64 expectedNext = uint64(block.timestamp) + INTERVAL;
        vm.expectEmit(true, false, false, true);
        emit PlanCreated(alice, AMOUNT, INTERVAL, expectedNext);
        _createPlan(alice);

        AutoSaveVault.Plan memory p = vault.getPlan(alice);
        assertEq(p.amount, AMOUNT);
        assertEq(p.interval, INTERVAL);
        assertEq(p.nextRun, expectedNext);
    }

    function test_CreatePlan_FirstSaveWaitsOneInterval() public {
        _createPlan(alice);
        assertFalse(vault.previewDue(alice));
    }

    function test_CreatePlan_RevertsZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(AutoSaveVault.ZeroAmount.selector);
        vault.createPlan(0, INTERVAL);
    }

    function test_CreatePlan_RevertsIntervalTooShort() public {
        vm.prank(alice);
        vm.expectRevert(AutoSaveVault.IntervalOutOfRange.selector);
        vault.createPlan(AMOUNT, 59);
    }

    function test_CreatePlan_RevertsIntervalTooLong() public {
        vm.prank(alice);
        vm.expectRevert(AutoSaveVault.IntervalOutOfRange.selector);
        vault.createPlan(AMOUNT, 365 days + 1);
    }

    function test_CreatePlan_Replaces() public {
        _createPlan(alice);
        vm.prank(alice);
        vault.createPlan(5e18, 2 days);
        AutoSaveVault.Plan memory p = vault.getPlan(alice);
        assertEq(p.amount, 5e18);
        assertEq(p.interval, 2 days);
    }

    function test_CreatePlan_RevertsWhenPaused() public {
        vm.prank(owner);
        vault.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vault.createPlan(AMOUNT, INTERVAL);
    }

    // ---------------------------------------------------------------------
    // executeSave
    // ---------------------------------------------------------------------
    function test_ExecuteSave_PullsAndCredits() public {
        _createPlan(alice);
        vm.warp(block.timestamp + INTERVAL);

        uint64 expectedNext = uint64(block.timestamp) + INTERVAL;
        vm.expectEmit(true, false, false, true);
        emit Saved(alice, AMOUNT, expectedNext, AMOUNT);

        vm.prank(keeper); // permissionless — anyone can poke
        vault.executeSave(alice);

        assertEq(vault.balanceOf(alice), AMOUNT);
        assertEq(cusd.balanceOf(address(vault)), AMOUNT);
        assertEq(cusd.balanceOf(alice), 1_000e18 - AMOUNT);
        assertEq(vault.getPlan(alice).nextRun, expectedNext);
    }

    function test_ExecuteSave_RevertsNotDue() public {
        _createPlan(alice);
        vm.prank(keeper);
        vm.expectRevert(AutoSaveVault.NotDue.selector);
        vault.executeSave(alice);
    }

    function test_ExecuteSave_RevertsNoActivePlan() public {
        vm.prank(keeper);
        vm.expectRevert(AutoSaveVault.NoActivePlan.selector);
        vault.executeSave(bob);
    }

    function test_ExecuteSave_RevertsWhenPaused() public {
        _createPlan(alice);
        vm.warp(block.timestamp + INTERVAL);
        vm.prank(owner);
        vault.pause();
        vm.prank(keeper);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        vault.executeSave(alice);
    }

    function test_ExecuteSave_MultipleCycles() public {
        _createPlan(alice);
        for (uint256 i = 1; i <= 3; i++) {
            vm.warp(block.timestamp + INTERVAL);
            vm.prank(keeper);
            vault.executeSave(alice);
            assertEq(vault.balanceOf(alice), AMOUNT * i);
        }
    }

    function test_ExecuteSave_RevertsIfAllowanceTooLow() public {
        _createPlan(alice);
        vm.prank(alice);
        cusd.approve(address(vault), 0); // revoke
        vm.warp(block.timestamp + INTERVAL);
        vm.prank(keeper);
        vm.expectRevert(); // SafeERC20 reverts; state must roll back
        vault.executeSave(alice);
        assertEq(vault.balanceOf(alice), 0);
        assertEq(vault.getPlan(alice).nextRun, uint64(block.timestamp)); // unchanged from create+warp
    }

    // ---------------------------------------------------------------------
    // withdraw
    // ---------------------------------------------------------------------
    function test_Withdraw_Works() public {
        _createPlan(alice);
        vm.warp(block.timestamp + INTERVAL);
        vm.prank(keeper);
        vault.executeSave(alice);

        vm.expectEmit(true, false, false, true);
        emit Withdrawn(alice, AMOUNT);
        vm.prank(alice);
        vault.withdraw(AMOUNT);

        assertEq(vault.balanceOf(alice), 0);
        assertEq(cusd.balanceOf(alice), 1_000e18); // got it all back
    }

    function test_Withdraw_PartialThenRest() public {
        _createPlan(alice);
        vm.warp(block.timestamp + INTERVAL);
        vm.prank(keeper);
        vault.executeSave(alice);

        vm.prank(alice);
        vault.withdraw(4e18);
        assertEq(vault.balanceOf(alice), 6e18);
        vm.prank(alice);
        vault.withdraw(6e18);
        assertEq(vault.balanceOf(alice), 0);
    }

    function test_Withdraw_RevertsInsufficient() public {
        vm.prank(alice);
        vm.expectRevert(AutoSaveVault.InsufficientBalance.selector);
        vault.withdraw(1);
    }

    function test_Withdraw_RevertsZero() public {
        vm.prank(alice);
        vm.expectRevert(AutoSaveVault.ZeroAmount.selector);
        vault.withdraw(0);
    }

    /// @dev The key trust guarantee: withdraw works EVEN when paused.
    function test_Withdraw_WorksWhilePaused() public {
        _createPlan(alice);
        vm.warp(block.timestamp + INTERVAL);
        vm.prank(keeper);
        vault.executeSave(alice);

        vm.prank(owner);
        vault.pause();

        vm.prank(alice);
        vault.withdraw(AMOUNT); // must NOT revert
        assertEq(cusd.balanceOf(alice), 1_000e18);
    }

    // ---------------------------------------------------------------------
    // cancelPlan
    // ---------------------------------------------------------------------
    function test_CancelPlan_DeletesAndEmits() public {
        _createPlan(alice);
        vm.expectEmit(true, false, false, false);
        emit PlanCancelled(alice);
        vm.prank(alice);
        vault.cancelPlan();
        assertEq(vault.getPlan(alice).amount, 0);
    }

    function test_CancelPlan_RevertsNoPlan() public {
        vm.prank(bob);
        vm.expectRevert(AutoSaveVault.NoActivePlan.selector);
        vault.cancelPlan();
    }

    function test_CancelPlan_WorksWhilePaused() public {
        _createPlan(alice);
        vm.prank(owner);
        vault.pause();
        vm.prank(alice);
        vault.cancelPlan(); // allowed
        assertEq(vault.getPlan(alice).amount, 0);
    }

    // ---------------------------------------------------------------------
    // access control
    // ---------------------------------------------------------------------
    function test_Pause_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vault.pause();
    }

    function test_Unpause_OnlyOwner() public {
        vm.prank(owner);
        vault.pause();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vault.unpause();
    }

    // ---------------------------------------------------------------------
    // fuzz
    // ---------------------------------------------------------------------
    function testFuzz_ExecuteThenWithdraw(uint128 amount, uint64 interval) public {
        amount = uint128(bound(amount, 1, 500e18));
        interval = uint64(bound(interval, vault.MIN_INTERVAL(), vault.MAX_INTERVAL()));

        vm.prank(alice);
        vault.createPlan(amount, interval);
        vm.warp(block.timestamp + interval);

        vm.prank(keeper);
        vault.executeSave(alice);
        assertEq(vault.balanceOf(alice), amount);

        vm.prank(alice);
        vault.withdraw(amount);
        assertEq(vault.balanceOf(alice), 0);
    }
}
