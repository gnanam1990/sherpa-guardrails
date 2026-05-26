// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SpendAccount is ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    enum RejectionReason {
        NONE,
        NOT_AGENT,
        PAUSED,
        REVOKED,
        COUNTERPARTY_BLOCKED,
        ZERO_AMOUNT,
        PER_TX_CAP_EXCEEDED,
        DAILY_CAP_EXCEEDED,
        COUNTERPARTY_CAP_EXCEEDED,
        INSUFFICIENT_BALANCE
    }

    IERC20Metadata public immutable usdc;
    uint8 public immutable usdcDecimals;

    address public operator;
    address public agent;

    bool public paused;
    bool public revoked;

    uint256 public perTxCap;
    uint256 public dailyCap;
    uint256 public currentDay;
    uint256 public daySpent;

    mapping(address => bool) public counterpartyAllowed;
    mapping(address => uint256) public counterpartyCap;
    mapping(address => uint256) public counterpartyDay;
    mapping(address => uint256) public counterpartySpent;

    event SpendExecuted(
        address indexed agent,
        address indexed counterparty,
        uint256 amount,
        bytes32 indexed action,
        uint256 remainingDailyCap
    );
    event SpendRejected(
        address indexed agent,
        address indexed counterparty,
        uint256 amount,
        bytes32 indexed action,
        RejectionReason reason
    );
    event CapsUpdated(uint256 perTxCap, uint256 dailyCap);
    event CounterpartyUpdated(address indexed counterparty, bool allowed, uint256 dailyCap);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event AgentRevoked(address indexed by);
    event Withdrawn(address indexed to, uint256 amount);

    error NotOperator();
    error ZeroAddress();
    error InvalidDecimals(uint8 decimals);

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    constructor(address operator_, address agent_, address usdc_) {
        if (operator_ == address(0) || agent_ == address(0) || usdc_ == address(0)) {
            revert ZeroAddress();
        }

        operator = operator_;
        agent = agent_;
        usdc = IERC20Metadata(usdc_);
        usdcDecimals = IERC20Metadata(usdc_).decimals();

        if (usdcDecimals != 6) {
            revert InvalidDecimals(usdcDecimals);
        }

        currentDay = _dayIndex();
    }

    function setCaps(uint256 perTxCap_, uint256 dailyCap_) external onlyOperator {
        perTxCap = perTxCap_;
        dailyCap = dailyCap_;
        emit CapsUpdated(perTxCap_, dailyCap_);
    }

    function setCounterparty(
        address counterparty,
        bool allowed,
        uint256 dailyCap_
    ) external onlyOperator {
        if (counterparty == address(0)) revert ZeroAddress();

        counterpartyAllowed[counterparty] = allowed;
        counterpartyCap[counterparty] = dailyCap_;

        emit CounterpartyUpdated(counterparty, allowed, dailyCap_);
    }

    function pause() external onlyOperator {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOperator {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function revokeAgent() external onlyOperator {
        revoked = true;
        emit AgentRevoked(msg.sender);
    }

    function withdraw(address to, uint256 amount) external onlyOperator nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        usdc.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }

    function canSpend(address counterparty, uint256 amount) public view returns (RejectionReason) {
        if (msg.sender != agent) return RejectionReason.NOT_AGENT;
        return _canSpend(counterparty, amount);
    }

    function canAgentSpend(address counterparty, uint256 amount) external view returns (RejectionReason) {
        return _canSpend(counterparty, amount);
    }

    function requestSpend(
        address counterparty,
        uint256 amount,
        bytes32 action
    ) external nonReentrant returns (bool ok, RejectionReason reason) {
        if (msg.sender != agent) {
            emit SpendRejected(msg.sender, counterparty, amount, action, RejectionReason.NOT_AGENT);
            return (false, RejectionReason.NOT_AGENT);
        }

        _rollGlobalDay();
        _rollCounterpartyDay(counterparty);

        reason = _canSpend(counterparty, amount);
        if (reason != RejectionReason.NONE) {
            emit SpendRejected(msg.sender, counterparty, amount, action, reason);
            return (false, reason);
        }

        daySpent += amount;
        counterpartySpent[counterparty] += amount;

        usdc.safeTransfer(counterparty, amount);

        emit SpendExecuted(msg.sender, counterparty, amount, action, dailyCap - daySpent);
        return (true, RejectionReason.NONE);
    }

    function remainingDailyCap() external view returns (uint256) {
        uint256 effectiveSpent = currentDay == _dayIndex() ? daySpent : 0;
        if (effectiveSpent >= dailyCap) return 0;
        return dailyCap - effectiveSpent;
    }

    function remainingCounterpartyCap(address counterparty) external view returns (uint256) {
        uint256 cap = counterpartyCap[counterparty];
        uint256 effectiveSpent = counterpartyDay[counterparty] == _dayIndex()
            ? counterpartySpent[counterparty]
            : 0;

        if (effectiveSpent >= cap) return 0;
        return cap - effectiveSpent;
    }

    function _canSpend(address counterparty, uint256 amount) internal view returns (RejectionReason) {
        if (paused) return RejectionReason.PAUSED;
        if (revoked) return RejectionReason.REVOKED;
        if (!counterpartyAllowed[counterparty]) return RejectionReason.COUNTERPARTY_BLOCKED;
        if (amount == 0) return RejectionReason.ZERO_AMOUNT;
        if (amount > perTxCap) return RejectionReason.PER_TX_CAP_EXCEEDED;

        uint256 effectiveDaySpent = currentDay == _dayIndex() ? daySpent : 0;
        if (effectiveDaySpent + amount > dailyCap) return RejectionReason.DAILY_CAP_EXCEEDED;

        uint256 effectiveCounterpartySpent = counterpartyDay[counterparty] == _dayIndex()
            ? counterpartySpent[counterparty]
            : 0;
        if (effectiveCounterpartySpent + amount > counterpartyCap[counterparty]) {
            return RejectionReason.COUNTERPARTY_CAP_EXCEEDED;
        }

        if (usdc.balanceOf(address(this)) < amount) return RejectionReason.INSUFFICIENT_BALANCE;

        return RejectionReason.NONE;
    }

    function _rollGlobalDay() internal {
        uint256 today = _dayIndex();
        if (today != currentDay) {
            currentDay = today;
            daySpent = 0;
        }
    }

    function _rollCounterpartyDay(address counterparty) internal {
        uint256 today = _dayIndex();
        if (counterpartyDay[counterparty] != today) {
            counterpartyDay[counterparty] = today;
            counterpartySpent[counterparty] = 0;
        }
    }

    function _dayIndex() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }
}
