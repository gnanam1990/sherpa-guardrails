// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SpendAccount} from "../src/SpendAccount.sol";
import {SpendAccountFactory} from "../src/SpendAccountFactory.sol";
import {MockUSDC} from "./MockUSDC.sol";

contract SpendAccountTest is Test {
    MockUSDC internal usdc;
    SpendAccount internal account;

    address internal operator = makeAddr("operator");
    address internal agent = makeAddr("agent");
    address internal counterparty = makeAddr("counterparty");
    address internal secondCounterparty = makeAddr("secondCounterparty");
    address internal stranger = makeAddr("stranger");

    bytes32 internal constant ACTION_API = keccak256("api_call");

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
        SpendAccount.RejectionReason reason
    );

    function setUp() public {
        usdc = new MockUSDC();

        vm.prank(operator);
        account = new SpendAccount(operator, agent, address(usdc));

        usdc.mint(address(account), 500e6);

        vm.startPrank(operator);
        account.setCaps(10e6, 50e6);
        account.setCounterparty(counterparty, true, 20e6);
        account.setCounterparty(secondCounterparty, true, 50e6);
        vm.stopPrank();
    }

    function testSpendUnderCapsExecutes() public {
        vm.expectEmit(true, true, true, true, address(account));
        emit SpendExecuted(agent, counterparty, 8e6, ACTION_API, 42e6);

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 8e6, ACTION_API);

        assertTrue(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.NONE));
        assertEq(usdc.balanceOf(counterparty), 8e6);
        assertEq(account.daySpent(), 8e6);
        assertEq(account.counterpartySpent(counterparty), 8e6);
    }

    function testPerTxCapBreachRejectsAndMovesNoFunds() public {
        vm.expectEmit(true, true, true, true, address(account));
        emit SpendRejected(
            agent,
            counterparty,
            11e6,
            ACTION_API,
            SpendAccount.RejectionReason.PER_TX_CAP_EXCEEDED
        );

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 11e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.PER_TX_CAP_EXCEEDED));
        assertEq(usdc.balanceOf(counterparty), 0);
        assertEq(account.daySpent(), 0);
    }

    function testDailyCapBreachRejectsAndMovesNoFunds() public {
        vm.startPrank(operator);
        account.setCaps(40e6, 50e6);
        account.setCounterparty(counterparty, true, 100e6);
        vm.stopPrank();

        vm.prank(agent);
        account.requestSpend(counterparty, 30e6, ACTION_API);

        vm.expectEmit(true, true, true, true, address(account));
        emit SpendRejected(
            agent,
            counterparty,
            30e6,
            ACTION_API,
            SpendAccount.RejectionReason.DAILY_CAP_EXCEEDED
        );

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 30e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.DAILY_CAP_EXCEEDED));
        assertEq(usdc.balanceOf(counterparty), 30e6);
        assertEq(account.daySpent(), 30e6);
    }

    function testCounterpartyCapBreachRejectsAndMovesNoFunds() public {
        vm.prank(operator);
        account.setCounterparty(counterparty, true, 7e6);

        vm.expectEmit(true, true, true, true, address(account));
        emit SpendRejected(
            agent,
            counterparty,
            8e6,
            ACTION_API,
            SpendAccount.RejectionReason.COUNTERPARTY_CAP_EXCEEDED
        );

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 8e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.COUNTERPARTY_CAP_EXCEEDED));
        assertEq(usdc.balanceOf(counterparty), 0);
    }

    function testBlockedCounterpartyRejects() public {
        vm.expectEmit(true, true, true, true, address(account));
        emit SpendRejected(
            agent,
            stranger,
            1e6,
            ACTION_API,
            SpendAccount.RejectionReason.COUNTERPARTY_BLOCKED
        );

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(stranger, 1e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.COUNTERPARTY_BLOCKED));
    }

    function testDayRolloverResetsGlobalAndCounterpartySpend() public {
        vm.prank(agent);
        account.requestSpend(counterparty, 8e6, ACTION_API);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 8e6, ACTION_API);

        assertTrue(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.NONE));
        assertEq(account.daySpent(), 8e6);
        assertEq(account.counterpartySpent(counterparty), 8e6);
    }

    function testPauseBlocksSpend() public {
        vm.prank(operator);
        account.pause();

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 1e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.PAUSED));
    }

    function testRevokeBlocksSpendPermanently() public {
        vm.prank(operator);
        account.revokeAgent();

        vm.prank(agent);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 1e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.REVOKED));

        vm.prank(operator);
        account.unpause();

        vm.prank(agent);
        (ok, reason) = account.requestSpend(counterparty, 1e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.REVOKED));
    }

    function testNonAgentCannotSpend() public {
        vm.expectEmit(true, true, true, true, address(account));
        emit SpendRejected(
            stranger,
            counterparty,
            1e6,
            ACTION_API,
            SpendAccount.RejectionReason.NOT_AGENT
        );

        vm.prank(stranger);
        (bool ok, SpendAccount.RejectionReason reason) =
            account.requestSpend(counterparty, 1e6, ACTION_API);

        assertFalse(ok);
        assertEq(uint256(reason), uint256(SpendAccount.RejectionReason.NOT_AGENT));
        assertEq(usdc.balanceOf(counterparty), 0);
    }

    function testNonOperatorAdminCallReverts() public {
        vm.prank(stranger);
        vm.expectRevert(SpendAccount.NotOperator.selector);
        account.setCaps(1e6, 1e6);
    }

    function testWithdrawReturnsFundsToOperatorChoice() public {
        vm.prank(operator);
        account.withdraw(operator, 10e6);

        assertEq(usdc.balanceOf(operator), 10e6);
        assertEq(usdc.balanceOf(address(account)), 490e6);
    }

    function testFactoryCreatesAccountForOperator() public {
        SpendAccountFactory factory = new SpendAccountFactory();

        vm.prank(operator);
        address deployed = factory.createAccount(agent, address(usdc));

        address[] memory accounts = factory.getAccounts(operator);
        assertEq(accounts.length, 1);
        assertEq(accounts[0], deployed);
        assertEq(SpendAccount(deployed).operator(), operator);
        assertEq(SpendAccount(deployed).agent(), agent);
    }

    function testFuzzAcceptedSpendNeverExceedsDailyCap(uint96 rawAmount) public {
        uint256 amount = bound(uint256(rawAmount), 1, 10e6);

        vm.prank(agent);
        account.requestSpend(secondCounterparty, amount, ACTION_API);

        assertLe(account.daySpent(), account.dailyCap());
    }
}
