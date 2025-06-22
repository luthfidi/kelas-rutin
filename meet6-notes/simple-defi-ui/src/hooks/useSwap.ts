import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import { config } from '../App';
import { SIMPLE_DEX_ABI, ERC20_ABI, CONTRACTS } from '../constants';
import { calculateSwapOutput, calculateMinAmountOut, parseTokenAmount } from '../utils/calculations';
import { usePoolData } from './usePoolData';
import toast from 'react-hot-toast';
import type { Token, SwapData } from '../types/defi';

export const useSwap = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { poolInfo } = usePoolData();
  const [isSwapping, setIsSwapping] = useState(false);

  const calculateSwap = (
    amountIn: string,
    tokenIn: Token,
    tokenOut: Token
  ): SwapData | null => {
    if (!amountIn || parseFloat(amountIn) <= 0) return null;

    const amountInBigInt = parseTokenAmount(amountIn, tokenIn.decimals);
    
    const isTokenAToB = tokenIn.symbol === 'CAMP';
    const reserveIn = isTokenAToB ? poolInfo.reserveA : poolInfo.reserveB;
    const reserveOut = isTokenAToB ? poolInfo.reserveB : poolInfo.reserveA;

    const amountOut = calculateSwapOutput(amountInBigInt, reserveIn, reserveOut);
    const amountOutFormatted = (Number(amountOut) / Math.pow(10, tokenOut.decimals)).toString();

    // Calculate fee
    const feeAmount = (parseFloat(amountIn) * 0.003).toString(); // 0.3% fee

    // Calculate price impact
    const priceImpact = reserveIn > 0 && reserveOut > 0 
      ? Math.abs((Number(amountOut) / Math.pow(10, tokenOut.decimals)) / (Number(reserveOut) / Math.pow(10, tokenOut.decimals)) - 
                  (Number(amountInBigInt) / Math.pow(10, tokenIn.decimals)) / (Number(reserveIn) / Math.pow(10, tokenIn.decimals))) * 100
      : 0;

    return {
      tokenIn,
      tokenOut,
      amountIn,
      amountOut: amountOutFormatted,
      priceImpact,
      fee: feeAmount,
    };
  };

  const executeSwap = async (swapData: SwapData): Promise<boolean> => {
    if (!address || !swapData) return false;

    setIsSwapping(true);
    
    try {
      const amountInBigInt = parseTokenAmount(swapData.amountIn, swapData.tokenIn.decimals);
      const amountOutBigInt = parseTokenAmount(swapData.amountOut, swapData.tokenOut.decimals);
      const minAmountOut = calculateMinAmountOut(amountOutBigInt);

      // Check dan approve token jika perlu
      await ensureTokenApproval(swapData.tokenIn, amountInBigInt);

      // Execute swap
      const isTokenAToB = swapData.tokenIn.symbol === 'CAMP';
      const functionName = isTokenAToB ? 'swapAforB' : 'swapBforA';

      toast.loading('Executing swap...', { id: 'swap' });

      const hash = await writeContractAsync({
        address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName,
        args: [amountInBigInt, minAmountOut],
        account: address,
      });

      toast.loading('Confirming transaction...', { id: 'swap' });

      await waitForTransactionReceipt(config, { hash });

      toast.success(
        `Successfully swapped ${swapData.amountIn} ${swapData.tokenIn.symbol} for ${swapData.amountOut} ${swapData.tokenOut.symbol}`,
        { id: 'swap', duration: 5000 }
      );

      return true;
    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Swap failed. Please try again.', { id: 'swap' });
      return false;
    } finally {
      setIsSwapping(false);
    }
  };

  const ensureTokenApproval = async (token: Token, amount: bigint) => {
    // Check current allowance
    // (This would need to be implemented with a separate hook or function)
    
    // If allowance is insufficient, approve
    const hash = await writeContractAsync({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.SIMPLE_DEX, amount],
      account: address!,
    });

    await waitForTransactionReceipt(config, { hash });
  };

  return {
    calculateSwap,
    executeSwap,
    isSwapping,
  };
};