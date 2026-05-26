// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SpendAccount} from "../src/SpendAccount.sol";
import {SpendAccountFactory} from "../src/SpendAccountFactory.sol";

contract DeployArc is Script {
    uint256 internal constant PER_TX_CAP = 10_000_000; // 10 USDC
    uint256 internal constant DAILY_CAP = 50_000_000; // 50 USDC

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDRESS");
        address usdc = vm.envAddress("ARC_USDC_ADDRESS");

        vm.startBroadcast(deployerKey);

        SpendAccountFactory factory = new SpendAccountFactory();
        address accountAddress = factory.createAccount(agent, usdc);
        SpendAccount account = SpendAccount(accountAddress);
        account.setCaps(PER_TX_CAP, DAILY_CAP);

        vm.stopBroadcast();

        console2.log("SpendAccountFactory:", address(factory));
        console2.log("SpendAccount:", accountAddress);
        console2.log("Agent:", agent);
        console2.log("USDC:", usdc);
        console2.log("Per-tx cap:", PER_TX_CAP);
        console2.log("Daily cap:", DAILY_CAP);
    }
}
