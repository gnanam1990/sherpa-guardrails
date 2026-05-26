import {
  createPublicClient,
  createWalletClient,
  http,
  keccak256,
  toBytes,
  type Chain,
  type PublicClient,
  type WalletClient,
} from "viem";
import { spendAccountAbi } from "./abi.js";
import { parseUsdc } from "./amounts.js";
import { arcTestnet } from "./chain.js";
import { decodeRejectionReason } from "./reasons.js";
import type {
  BudgetState,
  GuardrailsClientConfig,
  HexAddress,
  SpendRequest,
  SpendResult,
} from "./types.js";

export class GuardrailsClient {
  readonly accountAddress: HexAddress;
  readonly publicClient: PublicClient;
  readonly walletClient: WalletClient;
  readonly chain: Chain;

  constructor(private readonly config: GuardrailsClientConfig) {
    this.chain = config.chain ?? arcTestnet;
    const transport = http(config.rpcUrl ?? this.chain.rpcUrls.default.http[0]);

    this.accountAddress = config.accountAddress;
    this.publicClient = createPublicClient({ chain: this.chain, transport });
    this.walletClient = createWalletClient({
      account: config.account,
      chain: this.chain,
      transport,
    });
  }

  async state(): Promise<BudgetState> {
    const [perTxCap, dailyCap, daySpent, remainingDailyCap, paused, revoked] =
      await Promise.all([
        this.publicClient.readContract({
          address: this.accountAddress,
          abi: spendAccountAbi,
          functionName: "perTxCap",
        }),
        this.publicClient.readContract({
          address: this.accountAddress,
          abi: spendAccountAbi,
          functionName: "dailyCap",
        }),
        this.publicClient.readContract({
          address: this.accountAddress,
          abi: spendAccountAbi,
          functionName: "daySpent",
        }),
        this.publicClient.readContract({
          address: this.accountAddress,
          abi: spendAccountAbi,
          functionName: "remainingDailyCap",
        }),
        this.publicClient.readContract({
          address: this.accountAddress,
          abi: spendAccountAbi,
          functionName: "paused",
        }),
        this.publicClient.readContract({
          address: this.accountAddress,
          abi: spendAccountAbi,
          functionName: "revoked",
        }),
      ]);

    return {
      perTxCap,
      dailyCap,
      daySpent,
      remainingDailyCap,
      paused,
      revoked,
    };
  }

  async spend(request: SpendRequest): Promise<SpendResult> {
    const amountBaseUnits = parseUsdc(request.amountUsdc);
    const reasonValue = await this.publicClient.readContract({
      address: this.accountAddress,
      abi: spendAccountAbi,
      functionName: "canAgentSpend",
      args: [request.counterparty, amountBaseUnits],
    });
    const reason = decodeRejectionReason(Number(reasonValue));

    if (reason !== "NONE") {
      return {
        ok: false,
        reason,
        counterparty: request.counterparty,
        amountBaseUnits,
      };
    }

    const txHash = await this.walletClient.writeContract({
      address: this.accountAddress,
      abi: spendAccountAbi,
      functionName: "requestSpend",
      account: this.config.account,
      chain: this.chain,
      args: [
        request.counterparty,
        amountBaseUnits,
        actionToBytes32(request.action),
      ],
    });

    return {
      ok: true,
      txHash,
      counterparty: request.counterparty,
      amountBaseUnits,
    };
  }
}

export function createGuardrailsClient(config: GuardrailsClientConfig): GuardrailsClient {
  return new GuardrailsClient(config);
}

export function actionToBytes32(action: string): `0x${string}` {
  return keccak256(toBytes(action));
}
