// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AutoSaveVault — Xikomu
/// @notice Non-custodial recurring auto-save for a single ERC20 (cUSD) on Celo.
///         Users set one plan (amount + interval). A permissionless keeper calls
///         executeSave(user) on schedule to pull the amount via allowance into the
///         user's own balance. Users can withdraw anytime — even when paused.
/// @dev Immutable / non-upgradeable by design (anti-rug for a fund-holding contract).
///      No unbounded on-chain loops: the keeper iterates users OFF-chain and calls
///      executeSave per user (each call is O(1)). History is reconstructed from events.
///      Owner power is intentionally minimal: pause() only blocks NEW saves; it can
///      never touch, move, or lock user funds, and withdraw() ignores pause.
contract AutoSaveVault is Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants (hardcoded; no setters → no owner control over params) ---
    uint64 public constant MIN_INTERVAL = 60; // 60 seconds
    uint64 public constant MAX_INTERVAL = 365 days;

    // --- Immutable config ---
    /// @notice The savings token (cUSD). Set once at deploy, never changeable.
    IERC20 public immutable cusd;

    // --- Storage ---
    struct Plan {
        uint128 amount; // amount pulled per execution (18 decimals)  ┐
        uint64 interval; // seconds between saves                     ├ packed into 1 slot
        uint64 nextRun; // timestamp when next save becomes eligible  ┘
    }

    /// @notice One plan per user. A plan is "active" iff amount != 0.
    mapping(address => Plan) public plans;
    /// @notice Per-user saved balance of cusd.
    mapping(address => uint256) public balanceOf;

    // --- Events (history is read from these; nothing extra stored on-chain) ---
    event PlanCreated(address indexed user, uint128 amount, uint64 interval, uint64 nextRun);
    event PlanCancelled(address indexed user);
    event Saved(address indexed user, uint128 amount, uint64 nextRun, uint256 newBalance);
    event Withdrawn(address indexed user, uint256 amount);

    // --- Errors (custom = cheaper than require strings) ---
    error ZeroAddress();
    error ZeroAmount();
    error IntervalOutOfRange();
    error NoActivePlan();
    error NotDue();
    error InsufficientBalance();

    /// @param _cusd  Savings token address (mainnet cUSD by default; testnet token on testnet).
    /// @param _owner Initial owner (can only pause/unpause). Use a multisig in production.
    constructor(address _cusd, address _owner) Ownable(_owner) {
        // _owner == address(0) is already rejected by Ownable's constructor.
        if (_cusd == address(0)) revert ZeroAddress();
        cusd = IERC20(_cusd);
    }

    // -------------------------------------------------------------------------
    // User actions
    // -------------------------------------------------------------------------

    /// @notice Create or replace your auto-save plan. First save fires after one interval.
    /// @dev Blocked while paused (no new commitments during an emergency stop).
    function createPlan(uint128 amount, uint64 interval) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (interval < MIN_INTERVAL || interval > MAX_INTERVAL) revert IntervalOutOfRange();

        uint64 next = uint64(block.timestamp) + interval;
        plans[msg.sender] = Plan({amount: amount, interval: interval, nextRun: next});

        emit PlanCreated(msg.sender, amount, interval, next);
    }

    /// @notice Cancel your plan. Allowed even when paused (touches no funds).
    function cancelPlan() external {
        if (plans[msg.sender].amount == 0) revert NoActivePlan();
        delete plans[msg.sender];
        emit PlanCancelled(msg.sender);
    }

    /// @notice Withdraw saved cUSD. ALWAYS available — intentionally ignores pause.
    /// @dev CEI: checks → effects → interaction. nonReentrant as defense in depth.
    function withdraw(uint256 amount) external nonReentrant {
        uint256 bal = balanceOf[msg.sender];
        if (amount == 0) revert ZeroAmount();
        if (bal < amount) revert InsufficientBalance();

        balanceOf[msg.sender] = bal - amount; // effect
        cusd.safeTransfer(msg.sender, amount); // interaction

        emit Withdrawn(msg.sender, amount);
    }

    // -------------------------------------------------------------------------
    // Keeper (permissionless)
    // -------------------------------------------------------------------------

    /// @notice Execute a due save for `user`. Anyone may call (e.g. the keeper bot).
    /// @dev Safe to be permissionless: funds only ever move FROM the user's wallet
    ///      (which they pre-approved) INTO the user's OWN balance, withdrawable only
    ///      by them. nextRun rate-limits calls (anti-spam). CEI ordering enforced.
    function executeSave(address user) external nonReentrant whenNotPaused {
        Plan memory p = plans[user]; // single SLOAD of the packed slot
        if (p.amount == 0) revert NoActivePlan();
        if (block.timestamp < p.nextRun) revert NotDue();

        uint64 next = uint64(block.timestamp) + p.interval;
        plans[user].nextRun = next; // effect
        uint256 newBalance = balanceOf[user] + p.amount; // effect
        balanceOf[user] = newBalance;

        cusd.safeTransferFrom(user, address(this), p.amount); // interaction (reverts → full rollback)

        emit Saved(user, p.amount, next, newBalance);
    }

    // -------------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------------

    function getPlan(address user) external view returns (Plan memory) {
        return plans[user];
    }

    /// @notice True if `user` has an active plan that is due for execution now.
    function previewDue(address user) external view returns (bool) {
        Plan memory p = plans[user];
        return p.amount != 0 && block.timestamp >= p.nextRun;
    }

    // -------------------------------------------------------------------------
    // Admin (Ownable2Step) — minimal: emergency stop for NEW saves only.
    // -------------------------------------------------------------------------

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
