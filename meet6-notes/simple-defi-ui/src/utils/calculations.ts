import { DEX_CONFIG } from '../constants';

/**
 * Parse token amount string to bigint with decimals
 */
export const parseTokenAmount = (
  amount: string,
  decimals: number
): bigint => {
  if (!amount || amount === '0' || amount === '.') {
    return BigInt(0);
  }

  try {
    // Handle decimal numbers
    const [integerPart, decimalPart = ''] = amount.split('.');
    
    // Pad or truncate decimal part to match token decimals
    const paddedDecimals = decimalPart.padEnd(decimals, '0').slice(0, decimals);
    
    // Combine integer and decimal parts
    const fullAmount = integerPart + paddedDecimals;
    
    return BigInt(fullAmount);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
};

/**
 * Format bigint token amount to string with decimals
 */
export const formatTokenAmount = (
  amount: bigint,
  decimals: number,
  precision: number = 6
): string => {
  if (amount === BigInt(0)) return '0';

  const divisor = BigInt(10 ** decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;

  const integerPart = quotient.toString();
  const decimalPart = remainder.toString().padStart(decimals, '0');

  // Trim trailing zeros and limit precision
  const trimmedDecimal = decimalPart.replace(/0+$/, '').slice(0, precision);

  return trimmedDecimal ? `${integerPart}.${trimmedDecimal}` : integerPart;
};

/**
 * Calculate output amount untuk swap menggunakan constant product formula
 * Formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
 * Dengan fee: amountInWithFee = amountIn * (1000 - fee) / 1000
 */
export const calculateSwapOutput = (
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feePercent: number = DEX_CONFIG.FEE_PERCENT
): bigint => {
  if (amountIn === BigInt(0) || reserveIn === BigInt(0) || reserveOut === BigInt(0)) {
    return BigInt(0);
  }

  // Apply fee (0.3% = 3/1000)
  const feeNumerator = BigInt(Math.floor((1000 - feePercent * 10)));
  const feeDenominator = BigInt(1000);
  
  const amountInWithFee = (amountIn * feeNumerator) / feeDenominator;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  
  return numerator / denominator;
};

/**
 * Calculate price impact
 */
export const calculatePriceImpact = (
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number => {
  if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return 0;

  const currentPrice = Number(reserveOut) / Number(reserveIn);
  const amountOut = calculateSwapOutput(amountIn, reserveIn, reserveOut);
  
  if (amountOut === BigInt(0)) return 0;

  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;
  const newPrice = Number(newReserveOut) / Number(newReserveIn);
  
  const priceImpact = Math.abs((newPrice - currentPrice) / currentPrice) * 100;
  return Math.min(priceImpact, 100); // Cap at 100%
};

/**
 * Calculate minimum amount out dengan slippage tolerance
 */
export const calculateMinAmountOut = (
  amountOut: bigint,
  slippageTolerance: number = DEX_CONFIG.SLIPPAGE_TOLERANCE
): bigint => {
  const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100));
  return (amountOut * slippageMultiplier) / BigInt(10000);
};

/**
 * Calculate optimal amounts untuk add liquidity
 */
export const calculateOptimalLiquidityAmounts = (
  amountADesired: bigint,
  amountBDesired: bigint,
  reserveA: bigint,
  reserveB: bigint
): { amountA: bigint; amountB: bigint } => {
  if (reserveA === BigInt(0) || reserveB === BigInt(0)) {
    // First liquidity addition - use desired amounts
    return { amountA: amountADesired, amountB: amountBDesired };
  }

  // Calculate optimal amount B for given amount A
  const amountBOptimal = (amountADesired * reserveB) / reserveA;
  
  if (amountBOptimal <= amountBDesired) {
    return { amountA: amountADesired, amountB: amountBOptimal };
  }
  
  // Calculate optimal amount A for given amount B
  const amountAOptimal = (amountBDesired * reserveA) / reserveB;
  
  return { amountA: amountAOptimal, amountB: amountBDesired };
};

/**
 * Calculate LP tokens untuk liquidity addition
 */
export const calculateLPTokens = (
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint
): bigint => {
  if (totalSupply === BigInt(0)) {
    // First liquidity - use geometric mean
    return sqrt(amountA * amountB);
  }
  
  // Subsequent liquidity - use minimum ratio
  const liquidityA = (amountA * totalSupply) / reserveA;
  const liquidityB = (amountB * totalSupply) / reserveB;
  
  return liquidityA < liquidityB ? liquidityA : liquidityB;
};

/**
 * Calculate token amounts untuk liquidity removal
 */
export const calculateTokenAmountsFromLP = (
  lpTokens: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint
): { amountA: bigint; amountB: bigint } => {
  if (totalSupply === BigInt(0)) {
    return { amountA: BigInt(0), amountB: BigInt(0) };
  }
  
  const amountA = (lpTokens * reserveA) / totalSupply;
  const amountB = (lpTokens * reserveB) / totalSupply;
  
  return { amountA, amountB };
};

/**
 * Calculate share of pool
 */
export const calculatePoolShare = (
  lpTokens: bigint,
  totalSupply: bigint
): number => {
  if (totalSupply === BigInt(0)) return 0;
  return (Number(lpTokens) / Number(totalSupply)) * 100;
};

/**
 * Calculate Annual Percentage Rate (APR) from fees
 */
export const calculateAPR = (
  totalLiquidity: number,
  dailyVolume: number,
  feePercent: number = DEX_CONFIG.FEE_PERCENT
): number => {
  if (totalLiquidity === 0) return 0;
  
  const dailyFees = dailyVolume * (feePercent / 100);
  const annualFees = dailyFees * 365;
  
  return (annualFees / totalLiquidity) * 100;
};

/**
 * Helper function untuk integer square root
 */
function sqrt(value: bigint): bigint {
  if (value === BigInt(0)) return BigInt(0);
  
  let z = (value + BigInt(1)) / BigInt(2);
  let y = value;
  
  while (z < y) {
    y = z;
    z = (value / z + z) / BigInt(2);
  }
  
  return y;
}

/**
 * Check jika amount valid untuk transaction
 */
export const isValidAmount = (amount: string): boolean => {
  if (!amount || amount === '0' || amount === '.') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
};

/**
 * Calculate estimated USD value
 */
export const calculateUSDValue = (
  tokenAmount: bigint,
  tokenDecimals: number,
  pricePerToken: number
): number => {
  const amount = Number(tokenAmount) / Math.pow(10, tokenDecimals);
  return amount * pricePerToken;
};

/**
 * Safe conversion from string to number for display purposes
 */
export const safeParseFloat = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format number for display with proper precision
 */
export const formatDisplayNumber = (
  value: number,
  decimals: number = 6
): string => {
  if (value === 0) return '0';
  
  // For very small numbers, use scientific notation
  if (value < 0.000001) {
    return value.toExponential(2);
  }
  
  // For normal numbers, use fixed decimals
  return value.toFixed(decimals).replace(/\.?0+$/, '');
};