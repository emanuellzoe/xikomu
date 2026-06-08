// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {XikomuFlip} from "../src/XikomuFlip.sol";
import {TestUSD} from "../src/TestUSD.sol";

/// @notice Testnet deploy (e.g. Celo Sepolia) for the Lucky Flip game:
///         deploys a mintable TestUSD, the XikomuFlip game, mints play money to a
///         player, and seeds the house liquidity so wins can be paid immediately.
/// @dev Env: PRIVATE_KEY (deployer/owner), MINT_TO (optional player, default deployer),
///      HOUSE_AMOUNT (optional whole tokens, default 500),
///      PLAYER_AMOUNT (optional whole tokens, default 100).
///
/// Celo Sepolia:
///   forge script script/DeployFlipTestnet.s.sol \
///     --rpc-url https://forno.celo-sepolia.celo-testnet.org --broadcast
contract DeployFlipTestnet is Script {
    function run() external returns (TestUSD usd, XikomuFlip game) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address player = vm.envOr("MINT_TO", deployer);
        uint256 houseWhole = vm.envOr("HOUSE_AMOUNT", uint256(500));
        uint256 playerWhole = vm.envOr("PLAYER_AMOUNT", uint256(100));

        vm.startBroadcast(pk);
        usd = new TestUSD();
        game = new XikomuFlip(address(usd), deployer);

        // Seed the house so winners can be paid.
        usd.mint(deployer, houseWhole * 1e18);
        usd.approve(address(game), houseWhole * 1e18);
        game.fundHouse(houseWhole * 1e18);

        // Give the player some play money.
        usd.mint(player, playerWhole * 1e18);
        vm.stopBroadcast();

        console.log("TESTUSD_ADDRESS=%s", address(usd));
        console.log("FLIP_ADDRESS=%s", address(game));
        console.log("PLAYER=%s", player);
        console.log("HOUSE_FUNDED=%s", houseWhole);
        console.log("PLAYER_MINTED=%s", playerWhole);
    }
}
