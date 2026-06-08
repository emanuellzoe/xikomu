// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {XikomuFlip} from "../src/XikomuFlip.sol";

/// @notice Mainnet deploy for the native-CELO Lucky Flip game.
/// @dev Env:
///   PRIVATE_KEY   deployer/owner key
///   OWNER         initial owner (house + pause only); defaults to deployer
///   HOUSE_AMOUNT  optional whole CELO to seed the house pool from the deployer's
///                 balance at deploy time (sent as msg.value). 0 = skip.
///
/// Mainnet:
///   forge script script/DeployFlip.s.sol --rpc-url $CELO_RPC --broadcast
contract DeployFlip is Script {
    function run() external returns (XikomuFlip game) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address owner = vm.envOr("OWNER", deployer);
        uint256 houseWhole = vm.envOr("HOUSE_AMOUNT", uint256(0));

        console.log("Deployer:", deployer);
        console.log("Owner:   ", owner);

        vm.startBroadcast(pk);
        game = new XikomuFlip(owner);
        if (houseWhole > 0) {
            // requires deployer == owner (onlyOwner) and enough CELO balance
            game.fundHouse{value: houseWhole * 1e18}();
        }
        vm.stopBroadcast();

        console.log("FLIP_ADDRESS=%s", address(game));
        console.log("HOUSE_FUNDED=%s", houseWhole);
    }
}
