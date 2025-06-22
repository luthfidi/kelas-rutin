export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
}

export interface PoolInfo {
  reserveA: bigint;
  reserveB: bigint;
  totalLiquidity: bigint;
  price: bigint;
}

export interface SwapData {
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  fee: string;
}

export interface LiquidityData {
  tokenA: Token;
  tokenB: Token;
  amountA: string;
  amountB: string;
  lpTokens: string;
  shareOfPool: number;
}

export interface TransactionHistory {
  id: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  hash: string;
  timestamp: number;
  user: string;
  tokenA?: {
    symbol: string;
    amount: string;
  };
  tokenB?: {
    symbol: string;
    amount: string;
  };
  lpTokens?: string;
  status: 'pending' | 'success' | 'failed';
}

export interface PriceData {
  timestamp: number;
  price: number;
  volume24h: number;
  tvl: number;
}

export interface UserPosition {
  lpTokenBalance: bigint;
  shareOfPool: number;
  tokenAAmount: bigint;
  tokenBAmount: bigint;
  estimatedValue: number;
}