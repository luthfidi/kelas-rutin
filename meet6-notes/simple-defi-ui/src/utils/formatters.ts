import { TOKENS } from '../constants';

/**
 * Check if amount is valid for transaction
 */
export const isValidAmount = (amount: string): boolean => {
  if (!amount || amount === '0' || amount === '.') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
};

/**
 * Format number dengan pemisah ribuan
 */
export const formatNumber = (
  value: number | string, 
  decimals: number = 2
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Format token amount dengan symbol
 */
export const formatTokenAmount = (
  amount: bigint | string,
  tokenSymbol: keyof typeof TOKENS,
  decimals?: number
): string => {
  const token = TOKENS[tokenSymbol];
  const tokenDecimals = decimals || token.decimals;
  
  const value = typeof amount === 'string' 
    ? parseFloat(amount) 
    : Number(amount) / Math.pow(10, tokenDecimals);
    
  return `${formatNumber(value, 4)} ${token.symbol}`;
};

/**
 * Format USD value
 */
export const formatUSD = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers (K, M, B)
 */
export const formatLargeNumber = (value: number): string => {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return formatNumber(value);
};

/**
 * Format address untuk display
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format timestamp
 */
export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

/**
 * Format duration (seconds to human readable)
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

/**
 * Parse input amount to BigInt
 */
export const parseTokenAmount = (
  amount: string,
  decimals: number
): bigint => {
  if (!amount || isNaN(parseFloat(amount))) return BigInt(0);
  
  const [integer, decimal = ''] = amount.split('.');
  const paddedDecimal = decimal.padEnd(decimals, '0').slice(0, decimals);
  
  return BigInt(integer + paddedDecimal);
};

/**
 * Format BigInt to readable number
 */
export const formatBigInt = (
  value: bigint,
  decimals: number,
  displayDecimals: number = 4
): string => {
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  
  const decimalPart = remainder.toString().padStart(decimals, '0');
  const trimmedDecimal = decimalPart.slice(0, displayDecimals).replace(/0+$/, '');
  
  if (trimmedDecimal) {
    return `${quotient}.${trimmedDecimal}`;
  }
  return quotient.toString();
};

/**
 * Validate input string for numeric values
 */
export const isValidNumericInput = (value: string): boolean => {
  // Allow empty string, digits, and single decimal point
  return /^[\d]*\.?[\d]*$/.test(value);
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumericInput = (value: string): string => {
  // Remove all non-numeric characters except decimal point
  return value.replace(/[^\d.]/g, '')
    // Ensure only one decimal point
    .replace(/(\..*)\./g, '$1');
};

/**
 * Check if amount exceeds balance
 */
export const exceedsBalance = (
  amount: string,
  balance: bigint,
  decimals: number
): boolean => {
  if (!isValidAmount(amount)) return false;
  
  const amountBigInt = parseTokenAmount(amount, decimals);
  return amountBigInt > balance;
};

/**
 * Format token balance for display
 */
export const formatBalance = (
  balance: bigint,
  decimals: number,
  symbol: string,
  maxDecimals: number = 4
): string => {
  const formatted = formatBigInt(balance, decimals, maxDecimals);
  return `${formatted} ${symbol}`;
};