import SIMPLE_DEX_ABI_JSON from "./SIMPLE_DEX_ABI.json"
import ERC20_ABI_JSON from "./ERC20_ABI.json"
import { ENV } from "../config/env"

export const SIMPLE_DEX_ABI = SIMPLE_DEX_ABI_JSON;
export const ERC20_ABI = ERC20_ABI_JSON;

// Contract addresses using ENV config
export const CONTRACTS = {
  SIMPLE_DEX: ENV.SIMPLE_DEX_ADDRESS,
  CAMPUS_COIN: ENV.CAMPUS_COIN_ADDRESS,
  MOCK_USDC: ENV.MOCK_USDC_ADDRESS,
} as const;

// Validation
const requiredEnvVars = {
  VITE_SIMPLE_DEX_ADDRESS: CONTRACTS.SIMPLE_DEX,
  VITE_CAMPUS_COIN_ADDRESS: CONTRACTS.CAMPUS_COIN,
  VITE_MOCK_USDC_ADDRESS: CONTRACTS.MOCK_USDC,
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`❌ Missing environment variable: ${key}`);
  } else {
    console.log(`✅ ${key}: ${value}`);
  }
}

// Token configurations
export const TOKENS = {
  CAMP: {
    address: CONTRACTS.CAMPUS_COIN,
    symbol: "CAMP",
    name: "Campus Coin",
    decimals: 18,
    logo: "🏛️",
  },
  USDC: {
    address: CONTRACTS.MOCK_USDC,
    symbol: "USDC",
    name: "Mock USDC",
    decimals: 6,
    logo: "💵",
  },
} as const;

// DEX configuration
export const DEX_CONFIG = {
  FEE_PERCENT: 0.3, // 0.3%
  SLIPPAGE_TOLERANCE: 0.5, // 0.5%
  DEADLINE: 20, // 20 minutes
} as const;