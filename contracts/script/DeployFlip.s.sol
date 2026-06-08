// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {XikomuFlip} from "../src/XikomuFlip.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Mainnet deploy for the Lucky Flip game using REAL cUSD.
/// @dev Env:
///   PRIVATE_KEY   deployer/owner key
///   CUSD_ADDRESS  savings token; defaults to Celo MAINNET cUSD if unset
///   OWNER         initial owner (house + pause only); defaults to deployer
///   HOUSE_AMOUNT  optional whole cUSD to seed the house pool from the deployer's
///                 balance (requires the deployer to hold that cUSD). 0 = skip.
///
/// Mainnet:
///   forge script script/DeployFlip.s.sol --rpc-url $CELO_RPC --broadcast --verify \
///     --verifier-url https://api.celoscan.io/api --etherscan-api-key $CELOSCAN_API_KEY
contract DeployFlip is Script {
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    function run() external returns (XikomuFlip game) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address cusd = vm.envOr("CUSD_ADDRESS", CUSD_MAINNET);
        address owner = vm.envOr("OWNER", deployer);
        uint256 houseWhole = vm.envOr("HOUSE_AMOUNT", uint256(0));

        console.log("Deployer:", deployer);
        console.log("cUSD:    ", cusd);
        console.log("Owner:   ", owner);

        vm.startBroadcast(pk);
        game = new XikomuFlip(cusd, owner);
        if (houseWhole > 0) {
            uint256 amt = houseWhole * 1e18;
            IERC20(cusd).approve(address(game), amt);
            game.fundHouse(amt); // requires deployer == owner to pass onlyOwner
        }
        vm.stopBroadcast();

        console.log("FLIP_ADDRESS=%s", address(game));
        console.log("HOUSE_FUNDED=%s", houseWhole);
    }
}
