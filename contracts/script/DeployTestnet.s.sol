// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AutoSaveVault} from "../src/AutoSaveVault.sol";
import {TestUSD} from "../src/TestUSD.sol";

/// @notice Testnet deploy (e.g. Celo Sepolia): deploys a mintable TestUSD as the
///         savings token, deploys AutoSaveVault pointing at it, and mints test
///         tokens so you can try the full flow without a stablecoin faucet.
/// @dev Env: PRIVATE_KEY (deployer/owner), MINT_TO (optional, default deployer),
///      MINT_AMOUNT (optional whole tokens, default 1000).
///
/// Celo Sepolia:
///   forge script script/DeployTestnet.s.sol \
///     --rpc-url https://forno.celo-sepolia.celo-testnet.org --broadcast
contract DeployTestnet is Script {
    function run() external returns (TestUSD usd, AutoSaveVault vault) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address mintTo = vm.envOr("MINT_TO", deployer);
        uint256 mintWhole = vm.envOr("MINT_AMOUNT", uint256(1000));

        vm.startBroadcast(pk);
        usd = new TestUSD();
        vault = new AutoSaveVault(address(usd), deployer);
        usd.mint(mintTo, mintWhole * 1e18);
        vm.stopBroadcast();

        console.log("TESTUSD_ADDRESS=%s", address(usd));
        console.log("VAULT_ADDRESS=%s", address(vault));
        console.log("MINTED_TO=%s", mintTo);
        console.log("MINTED_AMOUNT=%s", mintWhole);
    }
}
