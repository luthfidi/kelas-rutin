import { createConfig } from "ponder";
import { http } from "viem";
import { SIMPLE_DEX_ABI } from "./abis/DexAbi";
import { ERC20_ABI } from "./abis/DexAbi";

export default createConfig({
  chains: {
    monadTestnet: {
      id: 10143,
      rpc: http("https://testnet-rpc.monad.xyz"),
    },
  },
  contracts: {
    SimpleDEX: {
      chain: "monadTestnet",
      address: "0x493185ee6e21b69a6782960E0f35aEEfF2a2F8a2",
      abi: SIMPLE_DEX_ABI,
      startBlock: 23980925,
    },
    CampusCoin: {
      chain: "monadTestnet", 
      address: "0x39b5aC632F550b0f3cD39180c0912e29DBc68De3",
      abi: ERC20_ABI,
      startBlock: 23980925,
    },
    MockUSDC: {
      chain: "monadTestnet",
      address: "0x3DA1769802400490E47C8D20fee171D81c89d208", 
      abi: ERC20_ABI,
      startBlock: 23980925,
    },
  },
  database: {
    kind: "pglite",
  }
});