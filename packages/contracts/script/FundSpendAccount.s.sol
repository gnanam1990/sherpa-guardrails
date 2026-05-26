// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Script, console2} from "forge-std/Script.sol";

contract FundSpendAccount is Script {
    using SafeERC20 for IERC20;

    uint256 internal constant DEFAULT_FUND_AMOUNT = 50_000_000; // 50 USDC

    function run() external {
        uint256 funderKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address accountAddress = vm.envAddress("SPEND_ACCOUNT_ADDRESS");
        address usdc = vm.envAddress("ARC_USDC_ADDRESS");
        uint256 amount = vm.envOr("DEMO_FUND_AMOUNT_BASE_UNITS", DEFAULT_FUND_AMOUNT);

        vm.startBroadcast(funderKey);
        IERC20(usdc).safeTransfer(accountAddress, amount);
        vm.stopBroadcast();

        console2.log("SpendAccount funded:", accountAddress);
        console2.log("USDC:", usdc);
        console2.log("Amount:", amount);
    }
}
