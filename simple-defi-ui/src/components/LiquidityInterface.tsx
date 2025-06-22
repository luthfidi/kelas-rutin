"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, Droplets, AlertCircle, Calculator } from "lucide-react"
import { useLiquidity } from "../hooks/useLiquidity"
import { useTokenBalance } from "../hooks/useTokenBalance"
import { usePoolData } from "../hooks/usePoolData"
import { TOKENS } from "../constants"
import { formatTokenAmount, formatPercentage, formatBigInt, isValidAmount } from "../utils/formatters"
import type { LiquidityData } from "../types/defi"

const LiquidityInterface = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add')
  const [amountA, setAmountA] = useState("")
  const [amountB, setAmountB] = useState("")
  const [removePercentage, setRemovePercentage] = useState(25)
  const [isCalculating, setIsCalculating] = useState(false)
  const [lastInputField, setLastInputField] = useState<'A' | 'B' | null>(null)

  const { 
    calculateAddLiquidity, 
    executeAddLiquidity, 
    executeRemoveLiquidity, 
    getUserPosition,
    isLoading 
  } = useLiquidity()

  const { poolInfo } = usePoolData()
  const campBalance = useTokenBalance(TOKENS.CAMP)
  const usdcBalance = useTokenBalance(TOKENS.USDC)
  const userPosition = getUserPosition()

  const [liquidityData, setLiquidityData] = useState<LiquidityData | null>(null)

  // Calculate the ratio between tokens based on pool reserves
  const getTokenRatio = () => {
    if (poolInfo.reserveA === BigInt(0) || poolInfo.reserveB === BigInt(0)) {
      return null // No liquidity yet, equal ratio
    }
    
    // CAMP per USDC = reserveA / reserveB (adjusted for decimals)
    const campPerUsdc = (Number(poolInfo.reserveA) / Math.pow(10, 18)) / (Number(poolInfo.reserveB) / Math.pow(10, 6))
    const usdcPerCamp = 1 / campPerUsdc
    
    return { campPerUsdc, usdcPerCamp }
  }

  // Auto-calculate the other token amount based on pool ratio
  const calculateOtherAmount = (inputAmount: string, inputToken: 'A' | 'B') => {
    if (!inputAmount || !isValidAmount(inputAmount)) return ""
    
    const ratio = getTokenRatio()
    if (!ratio) return "" // No pool ratio available yet
    
    const amount = parseFloat(inputAmount)
    
    if (inputToken === 'A') {
      // Input is CAMP, calculate USDC
      return (amount * ratio.usdcPerCamp).toFixed(6)
    } else {
      // Input is USDC, calculate CAMP
      return (amount * ratio.campPerUsdc).toFixed(6)
    }
  }

  // Handle CAMP amount input
  const handleAmountAChange = (value: string) => {
    setAmountA(value)
    setLastInputField('A')
    
    if (value && isValidAmount(value)) {
      setIsCalculating(true)
      const calculatedB = calculateOtherAmount(value, 'A')
      setTimeout(() => {
        setAmountB(calculatedB)
        setIsCalculating(false)
      }, 300) // Small delay for better UX
    } else {
      setAmountB("")
      setIsCalculating(false)
    }
  }

  // Handle USDC amount input
  const handleAmountBChange = (value: string) => {
    setAmountB(value)
    setLastInputField('B')
    
    if (value && isValidAmount(value)) {
      setIsCalculating(true)
      const calculatedA = calculateOtherAmount(value, 'B')
      setTimeout(() => {
        setAmountA(calculatedA)
        setIsCalculating(false)
      }, 300) // Small delay for better UX
    } else {
      setAmountA("")
      setIsCalculating(false)
    }
  }

  // Calculate liquidity when inputs change
  useEffect(() => {
    if (activeTab === 'add' && isValidAmount(amountA) && isValidAmount(amountB)) {
      const data = calculateAddLiquidity(amountA, amountB, TOKENS.CAMP, TOKENS.USDC)
      setLiquidityData(data)
    } else {
      setLiquidityData(null)
    }
  }, [amountA, amountB, activeTab, calculateAddLiquidity])

  const handleMaxA = () => {
    const balance = Number(campBalance.balance) / Math.pow(10, TOKENS.CAMP.decimals)
    handleAmountAChange(balance.toString())
  }

  const handleMaxB = () => {
    const balance = Number(usdcBalance.balance) / Math.pow(10, TOKENS.USDC.decimals)
    handleAmountBChange(balance.toString())
  }

  const handleAddLiquidity = async () => {
    if (!liquidityData) return
    const success = await executeAddLiquidity(liquidityData)
    if (success) {
      setAmountA("")
      setAmountB("")
      setLiquidityData(null)
      setLastInputField(null)
      campBalance.refetch()
      usdcBalance.refetch()
    }
  }

  const handleRemoveLiquidity = async () => {
    const lpAmount = (Number(userPosition.lpTokenBalance) * removePercentage / 100) / Math.pow(10, 18)
    const success = await executeRemoveLiquidity(lpAmount.toString())
    if (success) {
      campBalance.refetch()
      usdcBalance.refetch()
    }
  }

  const isInsufficientBalance = () => {
    if (!amountA || !amountB || !campBalance.balance || !usdcBalance.balance) return false
    
    const campAmount = parseFloat(amountA) * Math.pow(10, TOKENS.CAMP.decimals)
    const usdcAmount = parseFloat(amountB) * Math.pow(10, TOKENS.USDC.decimals)
    
    return campAmount > Number(campBalance.balance) || usdcAmount > Number(usdcBalance.balance)
  }

  const ratio = getTokenRatio()

  return (
    <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4 sm:px-0">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 card-hover border border-white/10 shadow-2xl">
        {/* Header with Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="flex p-1 rounded-xl border w-full sm:w-auto" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: "rgba(251, 250, 249, 0.2)"
            }}>
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === 'add' 
                    ? 'gradient-monad-primary text-white' 
                    : 'hover:bg-white/10'
                }`}
                style={{ color: activeTab === 'add' ? "#FBFAF9" : "rgba(251, 250, 249, 0.7)" }}
              >
                Add Liquidity
              </button>
              <button
                onClick={() => setActiveTab('remove')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                  activeTab === 'remove' 
                    ? 'gradient-monad-primary text-white' 
                    : 'hover:bg-white/10'
                }`}
                style={{ color: activeTab === 'remove' ? "#FBFAF9" : "rgba(251, 250, 249, 0.7)" }}
              >
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'add' ? (
          /* Add Liquidity Interface */
          <div className="space-y-4 sm:space-y-6">
            {/* Pool Ratio Info */}
            {ratio && (
              <div className="p-3 rounded-xl border" style={{
                backgroundColor: "rgba(131, 110, 249, 0.1)",
                borderColor: "rgba(131, 110, 249, 0.3)"
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4" style={{ color: "#836EF9" }} />
                  <span className="text-sm font-medium" style={{ color: "#FBFAF9" }}>
                    Current Pool Ratio
                  </span>
                </div>
                <div className="text-xs space-y-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  <div>1 CAMP = {ratio.usdcPerCamp.toFixed(6)} USDC</div>
                  <div>1 USDC = {ratio.campPerUsdc.toFixed(6)} CAMP</div>
                  <div className="mt-2 text-xs" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
                    💡 Enter amount in either field - the other will auto-calculate
                  </div>
                </div>
              </div>
            )}

            {/* Token A Input */}
            <div className="p-3 sm:p-4 rounded-xl border relative" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: lastInputField === 'A' ? "rgba(131, 110, 249, 0.5)" : "rgba(251, 250, 249, 0.2)"
            }}>
              {isCalculating && lastInputField === 'B' && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  {TOKENS.CAMP.symbol}
                </span>
                <span className="text-xs sm:text-sm truncate ml-2" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Balance: {formatTokenAmount(campBalance.balance, 'CAMP')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="number"
                  value={amountA}
                  onChange={(e) => handleAmountAChange(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-lg sm:text-xl font-bold outline-none input-primary min-w-0"
                  style={{ color: "#FBFAF9" }}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleMaxA}
                    className="px-2 py-1 text-xs rounded font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
                    style={{ color: "#836EF9" }}
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg">{TOKENS.CAMP.logo}</span>
                    <span className="font-medium text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                      {TOKENS.CAMP.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plus Icon */}
            <div className="flex justify-center">
              <div className="p-2 rounded-xl border" style={{
                backgroundColor: "rgba(131, 110, 249, 0.1)",
                borderColor: "rgba(131, 110, 249, 0.3)"
              }}>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#836EF9" }} />
              </div>
            </div>

            {/* Token B Input */}
            <div className="p-3 sm:p-4 rounded-xl border relative" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: lastInputField === 'B' ? "rgba(131, 110, 249, 0.5)" : "rgba(251, 250, 249, 0.2)"
            }}>
              {isCalculating && lastInputField === 'A' && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  {TOKENS.USDC.symbol}
                </span>
                <span className="text-xs sm:text-sm truncate ml-2" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Balance: {formatTokenAmount(usdcBalance.balance, 'USDC')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="number"
                  value={amountB}
                  onChange={(e) => handleAmountBChange(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-lg sm:text-xl font-bold outline-none input-primary min-w-0"
                  style={{ color: "#FBFAF9" }}
                />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleMaxB}
                    className="px-2 py-1 text-xs rounded font-medium hover:bg-white/20 transition-colors whitespace-nowrap"
                    style={{ color: "#836EF9" }}
                  >
                    MAX
                  </button>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg">{TOKENS.USDC.logo}</span>
                    <span className="font-medium text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                      {TOKENS.USDC.symbol}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Liquidity Details */}
            {liquidityData && (
              <div className="p-3 sm:p-4 rounded-xl border space-y-2" style={{
                backgroundColor: "rgba(14, 16, 15, 0.3)",
                borderColor: "rgba(251, 250, 249, 0.1)"
              }}>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>LP Tokens Received</span>
                  <span className="truncate ml-2" style={{ color: "#FBFAF9" }}>
                    {parseFloat(liquidityData.lpTokens).toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Share of Pool</span>
                  <span style={{ color: "#FBFAF9" }}>
                    {formatPercentage(liquidityData.shareOfPool)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Rate</span>
                  <span style={{ color: "#FBFAF9" }}>
                    1 CAMP = {ratio ? ratio.usdcPerCamp.toFixed(4) : 'N/A'} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={handleAddLiquidity}
              disabled={!liquidityData || isLoading || isInsufficientBalance() || isCalculating}
              className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
              style={{
                background: !liquidityData || isLoading || isInsufficientBalance() || isCalculating
                  ? "rgba(131, 110, 249, 0.3)"
                  : "linear-gradient(135deg, #836EF9 0%, #A0055D 100%)",
                color: "#FBFAF9"
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 sm:w-5 sm:h-5"></div>
                  <span>Adding Liquidity...</span>
                </div>
              ) : isCalculating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Calculating...</span>
                </div>
              ) : isInsufficientBalance() ? (
                "Insufficient Balance"
              ) : !liquidityData ? (
                "Enter Amount"
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Liquidity</span>
                </div>
              )}
            </button>
          </div>
        ) : (
          /* Remove Liquidity Interface */
          <div className="space-y-4 sm:space-y-6">
            {/* User Position */}
            <div className="p-3 sm:p-4 rounded-xl border" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: "rgba(251, 250, 249, 0.2)"
            }}>
              <h3 className="font-semibold mb-3 text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                Your Position
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>LP Tokens</span>
                  <span className="truncate ml-2" style={{ color: "#FBFAF9" }}>
                    {formatBigInt(userPosition.lpTokenBalance, 18, 6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>Pool Share</span>
                  <span style={{ color: "#FBFAF9" }}>
                    {formatPercentage(userPosition.shareOfPool)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>{TOKENS.CAMP.symbol}</span>
                  <span className="truncate ml-2" style={{ color: "#FBFAF9" }}>
                    {formatBigInt(userPosition.tokenAAmount, TOKENS.CAMP.decimals, 4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>{TOKENS.USDC.symbol}</span>
                  <span className="truncate ml-2" style={{ color: "#FBFAF9" }}>
                    {formatBigInt(userPosition.tokenBAmount, TOKENS.USDC.decimals, 4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Remove Percentage Selector */}
            <div className="p-3 sm:p-4 rounded-xl border" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: "rgba(251, 250, 249, 0.2)"
            }}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                  Remove Liquidity
                </span>
                <span className="text-xl sm:text-2xl font-bold" style={{ color: "#836EF9" }}>
                  {removePercentage}%
                </span>
              </div>

              {/* Percentage Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setRemovePercentage(percentage)}
                    className={`py-2 rounded font-medium transition-all duration-200 text-xs sm:text-sm ${
                      removePercentage === percentage
                        ? "gradient-monad-primary text-white"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    style={{ 
                      color: removePercentage === percentage ? "#FBFAF9" : "rgba(251, 250, 249, 0.7)" 
                    }}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>

              {/* Custom Slider */}
              <div className="mb-4">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={removePercentage}
                  onChange={(e) => setRemovePercentage(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #836EF9 0%, #836EF9 ${removePercentage}%, rgba(251, 250, 249, 0.2) ${removePercentage}%, rgba(251, 250, 249, 0.2) 100%)`
                  }}
                />
              </div>

              {/* Expected Output */}
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>You will receive:</span>
                </div>
                <div className="flex justify-between">
                  <span className="truncate mr-2" style={{ color: "#FBFAF9" }}>
                    {formatBigInt(userPosition.tokenAAmount * BigInt(removePercentage) / BigInt(100), TOKENS.CAMP.decimals, 4)} {TOKENS.CAMP.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="truncate mr-2" style={{ color: "#FBFAF9" }}>
                    {formatBigInt(userPosition.tokenBAmount * BigInt(removePercentage) / BigInt(100), TOKENS.USDC.decimals, 4)} {TOKENS.USDC.symbol}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            {userPosition.lpTokenBalance === BigInt(0) && (
              <div className="flex items-start gap-2 p-3 rounded-xl border" style={{
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderColor: "rgba(245, 158, 11, 0.3)"
              }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                <span className="text-xs sm:text-sm leading-tight" style={{ color: "#F59E0B" }}>
                  You don't have any liquidity positions to remove.
                </span>
              </div>
            )}

            {/* Remove Button */}
            <button
              onClick={handleRemoveLiquidity}
              disabled={isLoading || userPosition.lpTokenBalance === BigInt(0)}
              className="w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
              style={{
                background: isLoading || userPosition.lpTokenBalance === BigInt(0)
                  ? "rgba(239, 68, 68, 0.3)"
                  : "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                color: "#FBFAF9"
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4 sm:w-5 sm:h-5"></div>
                  <span>Removing Liquidity...</span>
                </div>
              ) : userPosition.lpTokenBalance === BigInt(0) ? (
                "No Liquidity to Remove"
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Remove Liquidity</span>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiquidityInterface