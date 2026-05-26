import { createPublicClient, formatUnits, getContract, http, isAddress } from "viem";
import {
  ARC_TESTNET,
  arcTestnet,
  spendAccountAbi,
} from "../packages/sdk/src/index.js";

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

const rpcUrl = process.env.ARC_TESTNET_RPC_URL ?? ARC_TESTNET.rpcUrl;
const client = createPublicClient({
  chain: arcTestnet,
  transport: http(rpcUrl),
});

async function main() {
  const chainId = await client.getChainId();
  const blockNumber = await client.getBlockNumber();

  console.log(`Arc RPC: ${rpcUrl}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Latest block: ${blockNumber}`);

  if (chainId !== ARC_TESTNET.chainId) {
    throw new Error(`Expected Arc chain ID ${ARC_TESTNET.chainId}, got ${chainId}`);
  }

  const usdc = getContract({
    address: ARC_TESTNET.usdcAddress,
    abi: erc20Abi,
    client,
  });

  const decimals = await usdc.read.decimals();
  console.log(`USDC ERC-20: ${ARC_TESTNET.usdcAddress}`);
  console.log(`USDC decimals: ${decimals}`);

  const addressToCheck = process.env.OPERATOR_ADDRESS ?? process.env.AGENT_ADDRESS;

  if (addressToCheck) {
    if (!isAddress(addressToCheck)) {
      throw new Error(`Invalid address in OPERATOR_ADDRESS/AGENT_ADDRESS: ${addressToCheck}`);
    }

    const balance = await usdc.read.balanceOf([addressToCheck]);
    console.log(`Balance ${addressToCheck}: ${formatUnits(balance, decimals)} USDC`);
  } else {
    console.log("No OPERATOR_ADDRESS or AGENT_ADDRESS set; skipped balance check.");
  }

  if (process.env.SPEND_ACCOUNT_ADDRESS) {
    if (!isAddress(process.env.SPEND_ACCOUNT_ADDRESS)) {
      throw new Error(`Invalid SPEND_ACCOUNT_ADDRESS: ${process.env.SPEND_ACCOUNT_ADDRESS}`);
    }

    const spendAccount = getContract({
      address: process.env.SPEND_ACCOUNT_ADDRESS,
      abi: spendAccountAbi,
      client,
    });
    const remaining = await spendAccount.read.remainingDailyCap();
    console.log(`SpendAccount remaining today: ${formatUnits(remaining, decimals)} USDC`);
  }

  console.log("ARC CHECK OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
