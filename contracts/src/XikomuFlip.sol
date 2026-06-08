// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title XikomuFlip — Lucky Flip, a MiniPay coin-flip game on Celo.
/// @notice Buy chips with cUSD, flip heads/tails (1 flip = 1 on-chain tx), win
///         ~1.95x your bet, and cash chips back out to cUSD anytime.
/// @dev Chips are denominated in cUSD wei (1 chip unit = 1 cUSD wei). The contract
///      is NOT a savings/DeFi vault: chips are game credits, and the owner can only
///      ever touch `houseLiquidity` — never a player's chips. Cash-out works even
///      while paused. No unbounded loops; flip() does no external calls (O(1)).
///
///      RANDOMNESS: flip() uses on-chain entropy (prevrandao + blockhash + nonce +
///      sender). This is fine for a low-stakes game but is NOT secure for high value
///      — a block proposer can bias it. Bets are capped by MAX_BET accordingly.
contract XikomuFlip is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Savings/stake token (cUSD on mainnet; a test token on testnets).
    IERC20 public immutable cusd;

    uint256 public constant MIN_BET = 1e16; // 0.01 cUSD
    uint256 public constant MAX_BET = 5e18; // 5 cUSD
    uint256 public constant PAYOUT_NUM = 195; // 1.95x total return on a win
    uint256 public constant PAYOUT_DEN = 100;

    /// @notice In-game chip balance per player (cUSD wei).
    mapping(address => uint256) public chips;
    /// @notice Sum of all player chips (accumulated at write — O(1), no loops).
    uint256 public totalChips;
    /// @notice Pool that pays out winnings; funded by the owner + losing bets.
    uint256 public houseLiquidity;

    uint256 private _nonce;

    event CreditsBought(address indexed player, uint256 amount, uint256 newChips);
    event CashedOut(address indexed player, uint256 amount, uint256 newChips);
    event Flipped(
        address indexed player,
        uint256 bet,
        bool choiceHeads,
        bool resultHeads,
        bool won,
        uint256 payout,
        uint256 newChips
    );
    event HouseFunded(uint256 amount, uint256 houseLiquidity);
    event HouseWithdrawn(uint256 amount, uint256 houseLiquidity);

    error ZeroAddress();
    error ZeroAmount();
    error BetOutOfRange();
    error InsufficientChips();
    error InsufficientHouse();

    constructor(address _cusd, address _owner) Ownable(_owner) {
        if (_cusd == address(0)) revert ZeroAddress();
        cusd = IERC20(_cusd);
    }

    // -------------------------------------------------------------------------
    // Player: buy chips / cash out
    // -------------------------------------------------------------------------

    /// @notice Buy chips with cUSD (1:1). Blocked while paused.
    function buyCredits(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        chips[msg.sender] += amount; // effects
        totalChips += amount;
        cusd.safeTransferFrom(msg.sender, address(this), amount); // interaction
        emit CreditsBought(msg.sender, amount, chips[msg.sender]);
    }

    /// @notice Cash chips back to cUSD. ALWAYS available — even while paused.
    function cashOut(uint256 amount) external nonReentrant {
        uint256 bal = chips[msg.sender];
        if (amount == 0) revert ZeroAmount();
        if (bal < amount) revert InsufficientChips();
        chips[msg.sender] = bal - amount; // effects
        totalChips -= amount;
        cusd.safeTransfer(msg.sender, amount); // interaction
        emit CashedOut(msg.sender, amount, chips[msg.sender]);
    }

    // -------------------------------------------------------------------------
    // Game
    // -------------------------------------------------------------------------

    /// @notice Flip a coin. Win → chips grow by ~0.95×bet (1.95× total); lose → bet
    ///         goes to the house. Pure internal accounting: no external calls, O(1).
    /// @return won       whether the player won
    /// @return resultHeads the coin result (true = heads)
    function flip(uint256 bet, bool choiceHeads)
        external
        whenNotPaused
        returns (bool won, bool resultHeads)
    {
        if (bet < MIN_BET || bet > MAX_BET) revert BetOutOfRange();
        uint256 bal = chips[msg.sender];
        if (bal < bet) revert InsufficientChips();

        uint256 netWin = (bet * PAYOUT_NUM) / PAYOUT_DEN - bet; // ~0.95 * bet
        if (houseLiquidity < netWin) revert InsufficientHouse();

        uint256 n = ++_nonce;
        uint256 r = uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, blockhash(block.number - 1), msg.sender, n, bet)
            )
        );
        resultHeads = (r & 1) == 0;
        won = resultHeads == choiceHeads;

        uint256 newChips;
        uint256 payout;
        if (won) {
            payout = netWin;
            newChips = bal + netWin;
            totalChips += netWin;
            houseLiquidity -= netWin;
        } else {
            newChips = bal - bet;
            totalChips -= bet;
            houseLiquidity += bet;
        }
        chips[msg.sender] = newChips;

        emit Flipped(msg.sender, bet, choiceHeads, resultHeads, won, payout, newChips);
    }

    // -------------------------------------------------------------------------
    // Owner: house liquidity (can NEVER touch player chips)
    // -------------------------------------------------------------------------

    function fundHouse(uint256 amount) external nonReentrant onlyOwner {
        if (amount == 0) revert ZeroAmount();
        houseLiquidity += amount; // effects
        cusd.safeTransferFrom(msg.sender, address(this), amount); // interaction
        emit HouseFunded(amount, houseLiquidity);
    }

    function withdrawHouse(uint256 amount) external nonReentrant onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (amount > houseLiquidity) revert InsufficientHouse();
        houseLiquidity -= amount; // effects
        cusd.safeTransfer(msg.sender, amount); // interaction
        emit HouseWithdrawn(amount, houseLiquidity);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    /// @notice Net winnings (added to chips) if a `bet` wins.
    function previewNetWin(uint256 bet) external pure returns (uint256) {
        return (bet * PAYOUT_NUM) / PAYOUT_DEN - bet;
    }

    /// @notice cUSD the contract must hold to back all chips + the house pool.
    function backingRequired() external view returns (uint256) {
        return totalChips + houseLiquidity;
    }
}
