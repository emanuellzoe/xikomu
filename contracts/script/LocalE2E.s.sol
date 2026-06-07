// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AutoSaveVault} from "../src/AutoSaveVault.sol";
import {MockERC20} from "../test/mocks/MockERC20.sol";

/// @notice Local-only: deploy mock cUSD + vault, fund Alice, set her plan.
///         Used to prove the keeper bot works against a live (anvil) node.
contract LocalE2E is Script {
    // anvil default accounts
    uint256 constant DEPLOYER_PK = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
    uint256 constant ALICE_PK = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    function run() external {
        address deployer = vm.addr(DEPLOYER_PK);
        address alice = vm.addr(ALICE_PK);

        vm.startBroadcast(DEPLOYER_PK);
        MockERC20 mock = new MockERC20();
        AutoSaveVault vault = new AutoSaveVault(address(mock), deployer);
        mock.mint(alice, 1_000e18);
        vm.stopBroadcast();

        vm.startBroadcast(ALICE_PK);
        mock.approve(address(vault), type(uint256).max);
        vault.createPlan(10e18, 60); // 10 mcUSD every 60s
        vm.stopBroadcast();

        console.log("MOCK_ADDRESS=%s", address(mock));
        console.log("VAULT_ADDRESS=%s", address(vault));
        console.log("ALICE=%s", alice);
    }
}
