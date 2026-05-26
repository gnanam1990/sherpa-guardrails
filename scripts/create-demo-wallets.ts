import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const deployerKey = generatePrivateKey();
const agentKey = generatePrivateKey();
const counterpartyKey = generatePrivateKey();

const deployer = privateKeyToAccount(deployerKey);
const agent = privateKeyToAccount(agentKey);
const counterparty = privateKeyToAccount(counterpartyKey);

console.log("# Sherpa demo wallet material");
console.log("# Store these in .env locally. Do not commit them.");
console.log("");
console.log(`DEPLOYER_PRIVATE_KEY=${deployerKey}`);
console.log(`AGENT_PRIVATE_KEY=${agentKey}`);
console.log(`AGENT_ADDRESS=${agent.address}`);
console.log(`COUNTERPARTY_ADDRESS=${counterparty.address}`);
console.log("");
console.log("# Fund this address before deploying on Arc Testnet:");
console.log(`OPERATOR_ADDRESS=${deployer.address}`);
console.log("");
console.log("# Optional receiver wallet if you want to inspect incoming demo USDC:");
console.log(`COUNTERPARTY_PRIVATE_KEY=${counterpartyKey}`);
