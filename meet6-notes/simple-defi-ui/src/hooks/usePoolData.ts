import { useReadContract } from 'wagmi';
import { SIMPLE_DEX_ABI, CONTRACTS } from '../constants';
import type { PoolInfo } from '../types/defi';

// Define the return type for the smart contract functions
type PoolDataResult = readonly [bigint, bigint, bigint, bigint];

export const usePoolData = () => {
  const { data: poolData, isLoading, refetch } = useReadContract({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    functionName: 'getPoolInfo',
    query: {
      refetchInterval: 15000, // Refetch every 15 seconds
    },
  });

  const { data: price, refetch: refetchPrice } = useReadContract({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    functionName: 'getPrice',
    query: {
      refetchInterval: 15000,
    },
  });

  // Type assertion with proper type checking
  const typedPoolData = poolData as PoolDataResult | undefined;

  const poolInfo: PoolInfo = typedPoolData ? {
    reserveA: typedPoolData[0],
    reserveB: typedPoolData[1],
    totalLiquidity: typedPoolData[2],
    price: typedPoolData[3],
  } : {
    reserveA: BigInt(0),
    reserveB: BigInt(0),
    totalLiquidity: BigInt(0),
    price: BigInt(0),
  };

  const currentPrice = (price as bigint) || BigInt(0);

  const refetchAll = () => {
    refetch();
    refetchPrice();
  };

  return {
    poolInfo,
    currentPrice,
    isLoading,
    refetch: refetchAll,
  };
};