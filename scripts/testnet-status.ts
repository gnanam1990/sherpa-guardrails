import "dotenv/config";
import {
  createPublicClient,
  formatUnits,
  getAddress,
  getContract,
  http,
  isAddress,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  ARC_TESTNET,
  arcTestnet,
  createGuardrailsClient,
  formatUsdc,
  spendAccountAbi,
  type HexAddress,
} from "../packages/sdk/src/index.js";

type CheckStatus = "OK" | "MISSING" | "WARN";

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
  console.log("Sherpa Arc Testnet status");
  console.log("=========================");
  console.log("");

  const chainId = await client.getChainId();
  const blockNumber = await client.getBlockNumber();
  printCheck(chainId === ARC_TESTNET.chainId ? "OK" : "WARN", "RPC chain", `${chainId}`);
  printCheck("OK", "Latest block", blockNumber.toString());
  printCheck("OK", "RPC URL", rpcUrl);
  printCheck(
    "OK",
    "Gas token",
    `USDC native (${ARC_TESTNET.nativeCurrencyDecimals} decimals)`,
  );
  printCheck(
    "OK",
    "USDC ERC-20",
    `${ARC_TESTNET.usdcAddress} (${ARC_TESTNET.usdcErc20Decimals} decimals)`,
  );
  console.log("");

  const deployer = readPrivateKeyAccount("DEPLOYER_PRIVATE_KEY");
  const agent = readPrivateKeyAccount("AGENT_PRIVATE_KEY");
  const operatorAddress = readAddress("OPERATOR_ADDRESS") ?? deployer?.address;
  const agentAddress = readAddress("AGENT_ADDRESS") ?? agent?.address;
  const counterpartyAddress = readAddress("COUNTERPARTY_ADDRESS");
  const spendAccountAddress = readAddress("SPEND_ACCOUNT_ADDRESS");

  printSection("Wallets");
  printCheck(deployer ? "OK" : "MISSING", "Deployer key", deployer ? "present" : "not set");
  printCheck(agent ? "OK" : "MISSING", "Agent key", agent ? "present" : "not set");
  printAddressCheck("Operator", operatorAddress);
  printAddressCheck("Agent", agentAddress);
  printAddressCheck("Counterparty", counterpartyAddress);

  if (deployer && operatorAddress && !sameAddress(deployer.address, operatorAddress)) {
    printCheck("WARN", "Operator mismatch", "OPERATOR_ADDRESS does not match DEPLOYER_PRIVATE_KEY");
  }

  if (agent && agentAddress && !sameAddress(agent.address, agentAddress)) {
    printCheck("WARN", "Agent mismatch", "AGENT_ADDRESS does not match AGENT_PRIVATE_KEY");
  }

  if (operatorAddress) {
    await printBalances("Operator", operatorAddress);
  }

  console.log("");
  printSection("Spend account");
  if (!spendAccountAddress) {
    printCheck("MISSING", "SPEND_ACCOUNT_ADDRESS", "deploy with pnpm testnet:deploy");
    printNextSteps(false);
    return;
  }

  const bytecode = await client.getBytecode({ address: spendAccountAddress });
  if (!bytecode || bytecode === "0x") {
    printCheck("WARN", "Contract code", "no contract found at SPEND_ACCOUNT_ADDRESS");
    printNextSteps(false);
    return;
  }

  printAddressCheck("SpendAccount", spendAccountAddress);
  await printSpendAccount(spendAccountAddress, counterpartyAddress);
  await printBalances("SpendAccount", spendAccountAddress);

  console.log("");
  printSection("Live demo readiness");
  const accountBalance = await erc20Balance(spendAccountAddress);
  printCheck(
    accountBalance >= 8_000_000n ? "OK" : "MISSING",
    "SpendAccount funding",
    `${formatUsdc(accountBalance)} USDC`,
  );
  printCheck(
    deployer ? "OK" : "MISSING",
    "Deploy/configure signer",
    deployer ? "ready" : "DEPLOYER_PRIVATE_KEY required",
  );
  printCheck(
    agent ? "OK" : "MISSING",
    "Agent signer",
    agent ? "ready" : "AGENT_PRIVATE_KEY required",
  );

  printNextSteps(true);
}

async function printSpendAccount(
  accountAddress: HexAddress,
  counterpartyAddress?: HexAddress,
) {
  const spendAccount = getContract({
    address: accountAddress,
    abi: spendAccountAbi,
    client,
  });
  const sherpa = createGuardrailsClient({
    accountAddress,
    rpcUrl,
  });

  const [operator, agent, usdc, state] = await Promise.all([
    spendAccount.read.operator(),
    spendAccount.read.agent(),
    spendAccount.read.usdc(),
    sherpa.state(),
  ]);

  printAddressCheck("Operator", operator as HexAddress);
  printAddressCheck("Agent", agent as HexAddress);
  printAddressCheck("USDC", usdc as HexAddress);
  printCheck("OK", "Per-tx cap", `${formatUsdc(state.perTxCap)} USDC`);
  printCheck("OK", "Daily cap", `${formatUsdc(state.dailyCap)} USDC`);
  printCheck("OK", "Spent today", `${formatUsdc(state.daySpent)} USDC`);
  printCheck("OK", "Remaining today", `${formatUsdc(state.remainingDailyCap)} USDC`);
  printCheck(state.paused ? "WARN" : "OK", "Paused", String(state.paused));
  printCheck(state.revoked ? "WARN" : "OK", "Revoked", String(state.revoked));

  if (counterpartyAddress) {
    const counterparty = await sherpa.counterpartyState(counterpartyAddress);
    printCheck(
      counterparty.allowed ? "OK" : "MISSING",
      "Counterparty allowed",
      counterparty.allowed ? counterpartyAddress : "run pnpm testnet:configure",
    );
    printCheck("OK", "Counterparty cap", `${formatUsdc(counterparty.cap)} USDC`);
    printCheck("OK", "Counterparty remaining", `${formatUsdc(counterparty.remaining)} USDC`);
  }
}

async function printBalances(label: string, address: Address) {
  const nativeBalance = await client.getBalance({ address });
  const tokenBalance = await erc20Balance(address);

  printCheck(
    nativeBalance > 0n ? "OK" : "MISSING",
    `${label} native gas`,
    `${formatUnits(nativeBalance, ARC_TESTNET.nativeCurrencyDecimals)} USDC`,
  );
  printCheck(
    tokenBalance > 0n ? "OK" : "MISSING",
    `${label} ERC-20 USDC`,
    `${formatUsdc(tokenBalance)} USDC`,
  );
}

async function erc20Balance(address: Address) {
  const usdc = getContract({
    address: ARC_TESTNET.usdcAddress,
    abi: erc20Abi,
    client,
  });

  return usdc.read.balanceOf([address]);
}

function readPrivateKeyAccount(name: string) {
  const value = process.env[name];
  if (!value) return undefined;

  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    printCheck("WARN", name, "private key must be 0x-prefixed 32 bytes");
    return undefined;
  }

  return privateKeyToAccount(value as `0x${string}`);
}

function readAddress(name: string): HexAddress | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  if (!isAddress(value)) {
    printCheck("WARN", name, "not a valid 0x address");
    return undefined;
  }
  return getAddress(value) as HexAddress;
}

function printSection(label: string) {
  console.log(label);
  console.log("-".repeat(label.length));
}

function printAddressCheck(label: string, address?: HexAddress) {
  printCheck(address ? "OK" : "MISSING", label, address ?? "not set");
}

function printCheck(status: CheckStatus, label: string, detail: string) {
  console.log(`${status.padEnd(8)} ${label.padEnd(24)} ${detail}`);
}

function printNextSteps(hasSpendAccount: boolean) {
  console.log("");
  printSection("Next commands");
  if (!hasSpendAccount) {
    console.log("1. pnpm wallets:demo");
    console.log("2. Fund OPERATOR_ADDRESS from the Arc Testnet faucet");
    console.log("3. pnpm testnet:deploy");
    console.log("4. Copy SpendAccount into SPEND_ACCOUNT_ADDRESS");
    console.log("5. pnpm testnet:configure && pnpm testnet:fund");
  } else {
    console.log("1. pnpm testnet:configure");
    console.log("2. pnpm testnet:fund");
    console.log("3. pnpm testnet:agent");
    console.log("4. pnpm testnet:dashboard");
  }
}

function sameAddress(left: Address, right: Address) {
  return left.toLowerCase() === right.toLowerCase();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
