import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5_042_002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const ARC_TESTNET = {
  chainId: arcTestnet.id,
  rpcUrl: arcTestnet.rpcUrls.default.http[0],
  wsUrl: arcTestnet.rpcUrls.default.webSocket?.[0],
  explorerUrl: arcTestnet.blockExplorers.default.url,
  usdcAddress: "0x3600000000000000000000000000000000000000" as const,
  nativeCurrencyDecimals: arcTestnet.nativeCurrency.decimals,
  usdcErc20Decimals: 6,
} as const;
