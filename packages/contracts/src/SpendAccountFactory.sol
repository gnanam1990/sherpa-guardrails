// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SpendAccount} from "./SpendAccount.sol";

contract SpendAccountFactory {
    mapping(address => address[]) private accountsByOperator;

    event AccountCreated(
        address indexed operator,
        address indexed agent,
        address indexed account,
        address usdc
    );

    function createAccount(address agent, address usdc) external returns (address account) {
        account = address(new SpendAccount(msg.sender, agent, usdc));
        accountsByOperator[msg.sender].push(account);
        emit AccountCreated(msg.sender, agent, account, usdc);
    }

    function getAccounts(address operator) external view returns (address[] memory) {
        return accountsByOperator[operator];
    }
}
