import { useState } from 'react';
import { useWriteContract, useAccount, useReadContract } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '../App';
import { SIMPLE_DEX_ABI, ERC20_ABI, CONTRACTS } from '../constants';
import { 
  calculateOptimalLiquidityAmounts, 
  calculateLPTokens, 
  calculateTokenAmountsFromLP,
  parseTokenAmount 
} from '../utils/calculations';
import { usePoolData } from './usePoolData';
import toast from 'react-hot-toast';
import type { Token, LiquidityData, UserPosition } from '../types/defi';

export const useLiquidity = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { poolInfo } = usePoolData();
  const [isLoading, setIsLoading] = useState(false);

  // Get user's LP token balance
  const { data: lpBalance } = useReadContract({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 30000,
    },
  });

  const calculateAddLiquidity = (
    amountA: string,
    amountB: string,
    tokenA: Token,
    tokenB: Token
  ): LiquidityData | null => {
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      return null;
    }

    const amountABigInt = parseTokenAmount(amountA, tokenA.decimals);
    const amountBBigInt = parseTokenAmount(amountB, tokenB.decimals);

    const optimal = calculateOptimalLiquidityAmounts(
      amountABigInt,
      amountBBigInt,
      poolInfo.reserveA,
      poolInfo.reserveB
    );

    const lpTokens = calculateLPTokens(
      optimal.amountA,
      optimal.amountB,
      poolInfo.reserveA,
      poolInfo.reserveB,
      poolInfo.totalLiquidity
    );

    const shareOfPool = poolInfo.totalLiquidity > 0 
      ? (Number(lpTokens) / (Number(poolInfo.totalLiquidity) + Number(lpTokens))) * 100
      : 100;

    return {
      tokenA,
      tokenB,
      amountA: (Number(optimal.amountA) / Math.pow(10, tokenA.decimals)).toString(),
      amountB: (Number(optimal.amountB) / Math.pow(10, tokenB.decimals)).toString(),
      lpTokens: (Number(lpTokens) / Math.pow(10, 18)).toString(),
      shareOfPool,
    };
  };

  const executeAddLiquidity = async (liquidityData: LiquidityData): Promise<boolean> => {
    if (!address) return false;

    setIsLoading(true);

    try {
      const amountA = parseTokenAmount(liquidityData.amountA, liquidityData.tokenA.decimals);
      const amountB = parseTokenAmount(liquidityData.amountB, liquidityData.tokenB.decimals);

      // Approve tokens
      await Promise.all([
        approveToken(liquidityData.tokenA, amountA),
        approveToken(liquidityData.tokenB, amountB),
      ]);

      toast.loading('Adding liquidity...', { id: 'liquidity' });

      const hash = await writeContractAsync({
        address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName: 'addLiquidity',
        args: [amountA, amountB],
        account: address,
      });

      toast.loading('Confirming transaction...', { id: 'liquidity' });

      await waitForTransactionReceipt(config, { hash });

      toast.success(
        `Successfully added ${liquidityData.amountA} ${liquidityData.tokenA.symbol} and ${liquidityData.amountB} ${liquidityData.tokenB.symbol} to the pool`,
        { id: 'liquidity', duration: 5000 }
      );

      return true;
    } catch (error) {
      console.error('Add liquidity failed:', error);
      toast.error('Failed to add liquidity. Please try again.', { id: 'liquidity' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const executeRemoveLiquidity = async (lpTokenAmount: string): Promise<boolean> => {
    if (!address || !lpTokenAmount) return false;

    setIsLoading(true);

    try {
      const lpAmount = parseTokenAmount(lpTokenAmount, 18);

      toast.loading('Removing liquidity...', { id: 'liquidity' });

      const hash = await writeContractAsync({
        address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName: 'removeLiquidity',
        args: [lpAmount],
        account: address,
      });

      toast.loading('Confirming transaction...', { id: 'liquidity' });

      await waitForTransactionReceipt(config, { hash });

      toast.success('Successfully removed liquidity from the pool', { 
        id: 'liquidity', 
        duration: 5000 
      });

      return true;
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      toast.error('Failed to remove liquidity. Please try again.', { id: 'liquidity' });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const approveToken = async (token: Token, amount: bigint) => {
    const hash = await writeContractAsync({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.SIMPLE_DEX, amount],
      account: address!,
    });

    await waitForTransactionReceipt(config, { hash });
  };

  const getUserPosition = (): UserPosition => {
    const lpTokenBalance = lpBalance as bigint || BigInt(0);
    
    if (lpTokenBalance === BigInt(0) || poolInfo.totalLiquidity === BigInt(0)) {
      return {
        lpTokenBalance: BigInt(0),
        shareOfPool: 0,
        tokenAAmount: BigInt(0),
        tokenBAmount: BigInt(0),
        estimatedValue: 0,
      };
    }

    const shareOfPool = (Number(lpTokenBalance) / Number(poolInfo.totalLiquidity)) * 100;
    const { amountA, amountB } = calculateTokenAmountsFromLP(
      lpTokenBalance,
      poolInfo.reserveA,
      poolInfo.reserveB,
      poolInfo.totalLiquidity
    );

    // Estimate USD value (you'd need price feeds for accurate calculation)
    const estimatedValue = 0; // Placeholder

    return {
      lpTokenBalance,
      shareOfPool,
      tokenAAmount: amountA,
      tokenBAmount: amountB,
      estimatedValue,
    };
  };

  return {
    calculateAddLiquidity,
    executeAddLiquidity,
    executeRemoveLiquidity,
    getUserPosition,
    isLoading,
  };
};