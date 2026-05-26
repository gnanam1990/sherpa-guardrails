import { access } from "node:fs/promises";
import { constants } from "node:fs";

const ARC_TESTNET_CHAIN_ID = 5042002;

const required = [
  "ARC_TESTNET_RPC_URL",
  "ARC_USDC_ADDRESS",
  "DEPLOYER_PRIVATE_KEY",
  "AGENT_PRIVATE_KEY",
  "AGENT_ADDRESS",
  "COUNTERPARTY_ADDRESS",
] as const;

async function main() {
  console.log("Sherpa live deployment readiness");
  console.log(`Target chain: Arc Testnet (${ARC_TESTNET_CHAIN_ID})`);
  console.log("");

  let missing = 0;
  for (const name of required) {
    const value = process.env[name];
    if (value) {
      console.log(`OK      ${name}`);
    } else {
      console.log(`MISSING ${name}`);
      missing += 1;
    }
  }

  console.log("");
  await checkFile("packages/contracts/script/DeployArc.s.sol");
  await checkFile("packages/contracts/script/ConfigureDemo.s.sol");
  await checkFile("packages/contracts/script/FundSpendAccount.s.sol");

  if (missing > 0) {
    throw new Error(
      `${missing} required environment value(s) missing for live Arc deployment`,
    );
  }

  console.log("");
  console.log("READY: deploy, configure, fund, run agent, connect dashboard.");
}

async function checkFile(path: string) {
  await access(path, constants.R_OK);
  console.log(`OK      ${path}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
