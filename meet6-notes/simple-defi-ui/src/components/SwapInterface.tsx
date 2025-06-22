"use client"

import { useState, useEffect } from "react"
import { ArrowUpDown, Settings, Zap, AlertTriangle, X } from "lucide-react"
import { useSwap } from "../hooks/useSwap"
import { useTokenBalance } from "../hooks/useTokenBalance"
import { TOKENS } from "../constants"
import { formatTokenAmount, formatPercentage, isValidAmount } from "../utils/formatters"
import type { Token, SwapData } from "../types/defi"

const SwapInterface = () => {
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS.CAMP)
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS.USDC)
  const [amountIn, setAmountIn] = useState("")
  const [slippageTolerance, setSlippageTolerance] = useState(0.5)
  const [showSettings, setShowSettings] = useState(false)

  const { calculateSwap, executeSwap, isSwapping } = useSwap()
  const tokenInBalance = useTokenBalance(tokenIn)
  const tokenOutBalance = useTokenBalance(tokenOut)

  const [swapData, setSwapData] = useState<SwapData | null>(null)

  // Calculate swap when inputs change
  useEffect(() => {
    if (isValidAmount(amountIn)) {
      const data = calculateSwap(amountIn, tokenIn, tokenOut)
      setSwapData(data)
    } else {
      setSwapData(null)
    }
  }, [amountIn, tokenIn, tokenOut, calculateSwap])

  const handleSwapTokens = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn("")
    setSwapData(null)
  }

  const handleMaxClick = () => {
    const balance = Number(tokenInBalance.balance) / Math.pow(10, tokenIn.decimals)
    setAmountIn(balance.toString())
  }

  const handleSwap = async () => {
    if (!swapData) return
    const success = await executeSwap(swapData)
    if (success) {
      setAmountIn("")
      setSwapData(null)
      tokenInBalance.refetch()
      tokenOutBalance.refetch()
    }
  }

  const isInsufficientBalance = () => {
    if (!amountIn || !tokenInBalance.balance) return false
    const inputAmount = parseFloat(amountIn) * Math.pow(10, tokenIn.decimals)
    return inputAmount > Number(tokenInBalance.balance)
  }

  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return "#10B981" // Green
    if (impact < 3) return "#F59E0B" // Yellow
    return "#EF4444" // Red
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4 sm:px-0">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 card-hover border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#FBFAF9" }}>
            Swap Tokens
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors relative"
            style={{ color: "rgba(251, 250, 249, 0.7)" }}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border" style={{
            backgroundColor: "rgba(14, 16, 15, 0.5)",
            borderColor: "rgba(251, 250, 249, 0.2)"
          }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#FBFAF9" }}>
                  Slippage Tolerance
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="sm:hidden p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: "rgba(251, 250, 249, 0.5)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                {slippageTolerance}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippageTolerance(value)}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                    slippageTolerance === value
                      ? "gradient-monad-primary text-white"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                  style={{ color: slippageTolerance === value ? "#FBFAF9" : "rgba(251, 250, 249, 0.7)" }}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token Input */}
        <div className="space-y-3 sm:space-y-4 mb-4">
          <div className="relative">
            <div className="p-3 sm:p-4 rounded-xl border" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: "rgba(251, 250, 249, 0.2)"
            }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  From
                </span>
                <span className="text-xs sm:text-sm truncate ml-2" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Balance: {formatTokenAmount(tokenInBalance.balance, tokenIn.symbol as keyof typeof TOKENS)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-lg sm:text-2xl font-bold outline-none input-primary min-w-0"
                  style={{ color: "#FBFAF9" }}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleMaxClick}
                    className="px-2 py-1 text-xs rounded font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
                    style={{ color: "#836EF9" }}
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 sm:gap-2 p-2 rounded-xl border" style={{
                    backgroundColor: "rgba(131, 110, 249, 0.1)",
                    borderColor: "rgba(131, 110, 249, 0.3)"
                  }}>
                    <span className="text-base sm:text-lg">{tokenIn.logo}</span>
                    <span className="font-medium text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                      {tokenIn.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="p-3 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-110"
              style={{ color: "#836EF9" }}
            >
              <ArrowUpDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Token Output */}
          <div className="relative">
            <div className="p-3 sm:p-4 rounded-xl border" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: "rgba(251, 250, 249, 0.2)"
            }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  To
                </span>
                <span className="text-xs sm:text-sm truncate ml-2" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Balance: {formatTokenAmount(tokenOutBalance.balance, tokenOut.symbol as keyof typeof TOKENS)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1 text-lg sm:text-2xl font-bold min-w-0 truncate" style={{ color: "#FBFAF9" }}>
                  {swapData?.amountOut || "0.0"}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 p-2 rounded-xl border flex-shrink-0" style={{
                  backgroundColor: "rgba(160, 5, 93, 0.1)",
                  borderColor: "rgba(160, 5, 93, 0.3)"
                }}>
                  <span className="text-base sm:text-lg">{tokenOut.logo}</span>
                  <span className="font-medium text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                    {tokenOut.symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Details */}
        {swapData && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border space-y-2" style={{
            backgroundColor: "rgba(14, 16, 15, 0.3)",
            borderColor: "rgba(251, 250, 249, 0.1)"
          }}>
            <div className="flex justify-between text-xs sm:text-sm">
              <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Price Impact</span>
              <span style={{ color: getPriceImpactColor(swapData.priceImpact) }}>
                {formatPercentage(swapData.priceImpact)}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Trading Fee</span>
              <span className="truncate ml-2" style={{ color: "#FBFAF9" }}>
                {swapData.fee} {tokenIn.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Minimum Received</span>
              <span className="truncate ml-2" style={{ color: "#FBFAF9" }}>
                {(parseFloat(swapData.amountOut) * (1 - slippageTolerance / 100)).toFixed(6)} {tokenOut.symbol}
              </span>
            </div>

            {/* Price Impact Warning */}
            {swapData.priceImpact > 3 && (
              <div className="flex items-start gap-2 p-2 sm:p-3 rounded border" style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderColor: "rgba(239, 68, 68, 0.3)"
              }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                <span className="text-xs sm:text-sm leading-tight" style={{ color: "#EF4444" }}>
                  High price impact! Consider reducing the swap amount.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!swapData || isSwapping || isInsufficientBalance()}
          className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
          style={{
            background: !swapData || isSwapping || isInsufficientBalance() 
              ? "rgba(131, 110, 249, 0.3)" 
              : "linear-gradient(135deg, #836EF9 0%, #A0055D 100%)",
            color: "#FBFAF9"
          }}
        >
          {isSwapping ? (
            <div className="flex items-center justify-center gap-2">
              <div className="spinner w-4 h-4 sm:w-5 sm:h-5"></div>
              <span>Swapping...</span>
            </div>
          ) : isInsufficientBalance() ? (
            "Insufficient Balance"
          ) : !swapData ? (
            "Enter Amount"
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Swap Tokens</span>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}

export default SwapInterface