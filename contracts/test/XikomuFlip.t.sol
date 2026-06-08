// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {XikomuFlip} from "../src/XikomuFlip.sol";
import {MockERC20} from "./mocks/MockERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract XikomuFlipTest is Test {
    XikomuFlip game;
    MockERC20 cusd;

    address owner = makeAddr("owner");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        cusd = new MockERC20();
        game = new XikomuFlip(address(cusd), owner);

        // Fund the house.
        cusd.mint(owner, 1_000e18);
        vm.startPrank(owner);
        cusd.approve(address(game), type(uint256).max);
        game.fundHouse(500e18);
        vm.stopPrank();

        // Fund Alice and let the game pull chips.
        cusd.mint(alice, 100e18);
        vm.prank(alice);
        cusd.approve(address(game), type(uint256).max);
    }

    /// invariant: contract holds exactly the chips + house it owes.
    function _assertBacked() internal view {
        assertEq(cusd.balanceOf(address(game)), game.totalChips() + game.houseLiquidity());
    }

    // ---------------------------------------------------------------- buy/cash
    function test_BuyCredits() public {
        vm.prank(alice);
        game.buyCredits(20e18);
        assertEq(game.chips(alice), 20e18);
        assertEq(game.totalChips(), 20e18);
        _assertBacked();
    }

    function test_BuyCredits_RevertsZero() public {
        vm.prank(alice);
        vm.expectRevert(XikomuFlip.ZeroAmount.selector);
        game.buyCredits(0);
    }

    function test_CashOut() public {
        vm.startPrank(alice);
        game.buyCredits(20e18);
        game.cashOut(8e18);
        vm.stopPrank();
        assertEq(game.chips(alice), 12e18);
        assertEq(cusd.balanceOf(alice), 100e18 - 12e18);
        _assertBacked();
    }

    function test_CashOut_RevertsInsufficient() public {
        vm.prank(alice);
        vm.expectRevert(XikomuFlip.InsufficientChips.selector);
        game.cashOut(1);
    }

    function test_CashOut_WorksWhilePaused() public {
        vm.prank(alice);
        game.buyCredits(20e18);
        vm.prank(owner);
        game.pause();
        vm.prank(alice);
        game.cashOut(20e18); // must NOT revert
        assertEq(game.chips(alice), 0);
    }

    // ------------------------------------------------------------------- flip
    function test_Flip_SettlesConsistently() public {
        vm.prank(alice);
        game.buyCredits(50e18);

        uint256 before = game.chips(alice);
        uint256 bet = 1e18;
        uint256 netWin = game.previewNetWin(bet);

        vm.prank(alice);
        (bool won,) = game.flip(bet, true);

        if (won) {
            assertEq(game.chips(alice), before + netWin);
        } else {
            assertEq(game.chips(alice), before - bet);
        }
        _assertBacked();
    }

    function test_Flip_RevertsBetTooLow() public {
        uint256 minBet = game.MIN_BET();
        vm.prank(alice);
        game.buyCredits(50e18);
        vm.prank(alice);
        vm.expectRevert(XikomuFlip.BetOutOfRange.selector);
        game.flip(minBet - 1, true);
    }

    function test_Flip_RevertsBetTooHigh() public {
        uint256 maxBet = game.MAX_BET();
        vm.prank(alice);
        game.buyCredits(50e18);
        vm.prank(alice);
        vm.expectRevert(XikomuFlip.BetOutOfRange.selector);
        game.flip(maxBet + 1, true);
    }

    function test_Flip_RevertsInsufficientChips() public {
        uint256 minBet = game.MIN_BET();
        vm.prank(alice);
        game.buyCredits(minBet); // tiny balance
        vm.prank(alice);
        vm.expectRevert(XikomuFlip.InsufficientChips.selector);
        game.flip(1e18, true);
    }

    function test_Flip_RevertsInsufficientHouse() public {
        // Drain the house, then a win cannot be paid.
        vm.prank(owner);
        game.withdrawHouse(500e18);
        vm.prank(alice);
        game.buyCredits(50e18);
        vm.prank(alice);
        vm.expectRevert(XikomuFlip.InsufficientHouse.selector);
        game.flip(1e18, true);
    }

    function test_Flip_RevertsWhenPaused() public {
        vm.prank(alice);
        game.buyCredits(50e18);
        vm.prank(owner);
        game.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        game.flip(1e18, true);
    }

    /// Many flips keep the backing invariant exact, regardless of outcomes.
    function test_Flip_ManyKeepsInvariant() public {
        vm.prank(alice);
        game.buyCredits(50e18);
        for (uint256 i = 0; i < 50; i++) {
            vm.roll(block.number + 1);
            vm.prevrandao(bytes32(uint256(i + 1)));
            if (game.chips(alice) < 1e18 || game.houseLiquidity() < game.previewNetWin(1e18)) break;
            vm.prank(alice);
            game.flip(1e18, i % 2 == 0);
            _assertBacked();
        }
    }

    // ------------------------------------------------------------------ owner
    function test_WithdrawHouse_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        game.withdrawHouse(1e18);
    }

    function test_WithdrawHouse_CannotExceedHouse() public {
        vm.prank(owner);
        vm.expectRevert(XikomuFlip.InsufficientHouse.selector);
        game.withdrawHouse(500e18 + 1);
    }

    /// Owner cannot reach player chips: after a player buys in, the most the owner
    /// can ever pull is houseLiquidity — the player can always cash out their chips.
    function test_Owner_CannotTouchPlayerChips() public {
        vm.prank(alice);
        game.buyCredits(40e18);
        uint256 house = game.houseLiquidity();
        vm.prank(owner);
        game.withdrawHouse(house); // drain entire house
        // Alice's chips remain fully redeemable.
        vm.prank(alice);
        game.cashOut(40e18);
        assertEq(cusd.balanceOf(alice), 100e18);
    }

    function test_Pause_OnlyOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        game.pause();
    }

    function testFuzz_BuyFlipCashKeepsBacking(uint256 buy, uint256 betSeed, bool choice) public {
        buy = bound(buy, 1e18, 90e18);
        uint256 bet = bound(betSeed, game.MIN_BET(), 5e18);
        vm.prank(alice);
        game.buyCredits(buy);
        if (game.chips(alice) >= bet && game.houseLiquidity() >= game.previewNetWin(bet)) {
            vm.prank(alice);
            game.flip(bet, choice);
        }
        _assertBacked();
    }
}
