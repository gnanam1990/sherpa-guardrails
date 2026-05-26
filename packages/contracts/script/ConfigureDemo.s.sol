// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SpendAccount} from "../src/SpendAccount.sol";

contract ConfigureDemo is Script {
    uint256 internal constant DEFAULT_PER_TX_CAP = 10_000_000; // 10 USDC
    uint256 internal constant DEFAULT_DAILY_CAP = 50_000_000; // 50 USDC
    uint256 internal constant DEFAULT_COUNTERPARTY_CAP = 20_000_000; // 20 USDC

    function run() external {
        uint256 operatorKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address accountAddress = vm.envAddress("SPEND_ACCOUNT_ADDRESS");
        address counterparty = vm.envAddress("COUNTERPARTY_ADDRESS");
        uint256 perTxCap = vm.envOr("SPEND_PER_TX_CAP_BASE_UNITS", DEFAULT_PER_TX_CAP);
        uint256 dailyCap = vm.envOr("SPEND_DAILY_CAP_BASE_UNITS", DEFAULT_DAILY_CAP);
        uint256 counterpartyCap = vm.envOr("COUNTERPARTY_DAILY_CAP_BASE_UNITS", DEFAULT_COUNTERPARTY_CAP);

        SpendAccount account = SpendAccount(accountAddress);

        vm.startBroadcast(operatorKey);
        account.setCaps(perTxCap, dailyCap);
        account.setCounterparty(counterparty, true, counterpartyCap);
        vm.stopBroadcast();

        console2.log("SpendAccount configured:", accountAddress);
        console2.log("Agent:", account.agent());
        console2.log("Counterparty allowed:", counterparty);
        console2.log("Per-tx cap:", perTxCap);
        console2.log("Daily cap:", dailyCap);
        console2.log("Counterparty daily cap:", counterpartyCap);
    }
}
