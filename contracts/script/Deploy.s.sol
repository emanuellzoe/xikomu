// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AutoSaveVault} from "../src/AutoSaveVault.sol";

/// @notice Deploys AutoSaveVault.
/// @dev Env vars:
///      PRIVATE_KEY  — deployer key (also default owner)
///      CUSD_ADDRESS — savings token; defaults to Celo MAINNET cUSD if unset
///      OWNER        — initial owner (pause only); defaults to deployer
///
/// Mainnet:
///   forge script script/Deploy.s.sol --rpc-url $CELO_RPC --broadcast --verify \
///     --verifier-url https://api.celoscan.io/api --etherscan-api-key $CELOSCAN_API_KEY
contract Deploy is Script {
    // Celo Mainnet cUSD
    address constant CUSD_MAINNET = 0x765DE816845861e75A25fCA122bb6898B8B1282a;

    function run() external returns (AutoSaveVault vault) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        address cusd = vm.envOr("CUSD_ADDRESS", CUSD_MAINNET);
        address owner = vm.envOr("OWNER", deployer);

        console.log("Deployer:", deployer);
        console.log("cUSD:    ", cusd);
        console.log("Owner:   ", owner);

        vm.startBroadcast(pk);
        vault = new AutoSaveVault(cusd, owner);
        vm.stopBroadcast();

        console.log("AutoSaveVault deployed at:", address(vault));
    }
}
