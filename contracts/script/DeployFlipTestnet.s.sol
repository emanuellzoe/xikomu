// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {XikomuFlip} from "../src/XikomuFlip.sol";

/// @notice Testnet deploy (e.g. Celo Sepolia) for the native-CELO Lucky Flip game:
///         deploys the game and seeds the house from the deployer's CELO so wins can
///         be paid immediately.
/// @dev Env: PRIVATE_KEY (deployer/owner), HOUSE_AMOUNT (optional whole CELO,
///      default 5). Players just need testnet CELO in their own wallet.
///
/// Celo Sepolia:
///   forge script script/DeployFlipTestnet.s.sol \
///     --rpc-url https://forno.celo-sepolia.celo-testnet.org --broadcast
contract DeployFlipTestnet is Script {
    function run() external returns (XikomuFlip game) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        uint256 houseWhole = vm.envOr("HOUSE_AMOUNT", uint256(5));

        vm.startBroadcast(pk);
        game = new XikomuFlip(deployer);
        game.fundHouse{value: houseWhole * 1e18}();
        vm.stopBroadcast();

        console.log("FLIP_ADDRESS=%s", address(game));
        console.log("HOUSE_FUNDED=%s", houseWhole);
    }
}
