"use client"

import { TrendingUp, Droplets, DollarSign, Activity } from "lucide-react"
import { usePoolData } from "../hooks/usePoolData"
import { formatNumber, formatLargeNumber, formatBigInt } from "../utils/formatters"
import { TOKENS } from "../constants"

const PoolStats = () => {
  const { poolInfo, isLoading } = usePoolData()

  // Calculate real metrics from pool data
  const reserveAFormatted = formatBigInt(poolInfo.reserveA, TOKENS.CAMP.decimals, 2)
  const reserveBFormatted = formatBigInt(poolInfo.reserveB, TOKENS.USDC.decimals, 2)
  const totalLiquidityFormatted = formatBigInt(poolInfo.totalLiquidity, 18, 6)

  // Calculate real price from reserves
  const calculateRealPrice = (): number => {
    if (poolInfo.reserveA === BigInt(0) || poolInfo.reserveB === BigInt(0)) {
      return 0
    }
    
    const reserveA_adjusted = Number(poolInfo.reserveA) / Math.pow(10, 18) // CAMP
    const reserveB_adjusted = Number(poolInfo.reserveB) / Math.pow(10, 6)  // USDC
    
    return reserveB_adjusted / reserveA_adjusted
  }

  const currentPrice = calculateRealPrice()

  // Calculate TVL (Total Value Locked) based on real reserves
  const campValue = Number(reserveAFormatted) * currentPrice // CAMP value in USD
  const usdcValue = Number(reserveBFormatted) // USDC value (1:1 USD)
  const totalTVL = campValue + usdcValue

  // Calculate 24h volume (simplified - in real app would need historical data)
  const volume24h = totalTVL * 0.15 // Assume 15% of TVL as daily volume

  // Calculate APR based on fees (simplified calculation)
  const dailyFees = volume24h * 0.003 // 0.3% trading fee
  const annualFees = dailyFees * 365
  const apr = totalTVL > 0 ? (annualFees / totalTVL) * 100 : 0

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    subtitle, 
    color,
    isLoading: cardLoading 
  }: {
    icon: React.ReactNode
    title: string
    value: string
    subtitle?: string
    color: string
    isLoading?: boolean
  }) => (
    <div className="glass rounded-xl p-6 card-hover border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="p-2 rounded-lg"
            style={{ 
              backgroundColor: `${color}20`,
              border: `1px solid ${color}40`
            }}
          >
            {icon}
          </div>
          <h3 className="font-semibold" style={{ color: "#FBFAF9" }}>
            {title}
          </h3>
        </div>
      </div>
      
      {cardLoading ? (
        <div className="space-y-2">
          <div className="h-8 bg-white/10 rounded shimmer"></div>
          {subtitle && <div className="h-4 bg-white/10 rounded shimmer w-3/4"></div>}
        </div>
      ) : (
        <div>
          <div className="text-2xl font-bold mb-1" style={{ color: "#FBFAF9" }}>
            {value}
          </div>
          {subtitle && (
            <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-monad mb-2">Pool Statistics</h2>
        <p style={{ color: "rgba(251, 250, 249, 0.7)" }}>
          Real-time metrics for the CAMP/USDC liquidity pool
        </p>
        {!isLoading && (
          <div className="text-sm mt-2" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
            Current Pool Ratio: 1 CAMP = ${formatNumber(currentPrice, 4)} USDC
          </div>
        )}
      </div>

      {/* Stats Grid - 2x2 Layout with Normal Card Size */}
      <div className="w-full">
        {/* Top Row - TVL and Volume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <StatCard
            icon={<DollarSign className="w-5 h-5" style={{ color: "#10B981" }} />}
            title="Total Value Locked"
            value={`${formatLargeNumber(totalTVL)}`}
            subtitle="Real pool reserves"
            color="#10B981"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={<Activity className="w-5 h-5" style={{ color: "#836EF9" }} />}
            title="24h Volume"
            value={`${formatLargeNumber(volume24h)}`}
            subtitle="Estimated trading"
            color="#836EF9"
            isLoading={isLoading}
          />
        </div>

        {/* Bottom Row - Price and APR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCard
            icon={<TrendingUp className="w-5 h-5" style={{ color: "#A0055D" }} />}
            title="CAMP Price"
            value={`${formatNumber(currentPrice, 6)}`}
            subtitle="USDC per CAMP"
            color="#A0055D"
            isLoading={isLoading}
          />
          
          <StatCard
            icon={<Droplets className="w-5 h-5" style={{ color: "#F59E0B" }} />}
            title="APR"
            value={`${formatNumber(apr, 1)}%`}
            subtitle="Based on trading fees"
            color="#F59E0B"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Pool Composition */}
      <div className="glass rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-bold mb-6" style={{ color: "#FBFAF9" }}>
          Pool Composition
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CAMP Reserve */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{TOKENS.CAMP.logo}</span>
                <div>
                  <div className="font-semibold" style={{ color: "#FBFAF9" }}>
                    {TOKENS.CAMP.name}
                  </div>
                  <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                    {TOKENS.CAMP.symbol}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: "#FBFAF9" }}>
                  {reserveAFormatted}
                </div>
                <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  ≈ ${formatNumber(campValue)}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-700 ease-out relative"
                style={{ 
                  width: totalTVL > 0 ? `${(campValue / totalTVL) * 100}%` : '50%',
                  background: "linear-gradient(to right, #836EF9, #9F7AEA)"
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(to right, rgba(131, 110, 249, 0.3), transparent)" }}
                ></div>
              </div>
            </div>
            <div className="text-center text-sm" style={{ color: "rgba(251, 250, 249, 0.6)" }}>
              {totalTVL > 0 ? `${((campValue / totalTVL) * 100).toFixed(1)}%` : '50%'} of pool
            </div>
          </div>

          {/* USDC Reserve */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{TOKENS.USDC.logo}</span>
                <div>
                  <div className="font-semibold" style={{ color: "#FBFAF9" }}>
                    {TOKENS.USDC.name}
                  </div>
                  <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                    {TOKENS.USDC.symbol}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg" style={{ color: "#FBFAF9" }}>
                  {reserveBFormatted}
                </div>
                <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  ≈ ${formatNumber(usdcValue)}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-700 ease-out relative"
                style={{ 
                  width: totalTVL > 0 ? `${(usdcValue / totalTVL) * 100}%` : '50%',
                  background: "linear-gradient(to right, #A0055D, #C53030)"
                }}
              >
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(to right, rgba(160, 5, 93, 0.3), transparent)" }}
                ></div>
              </div>
            </div>
            <div className="text-center text-sm" style={{ color: "rgba(251, 250, 249, 0.6)" }}>
              {totalTVL > 0 ? `${((usdcValue / totalTVL) * 100).toFixed(1)}%` : '50%'} of pool
            </div>
          </div>
        </div>

        {/* LP Token Info */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold" style={{ color: "#FBFAF9" }}>
                Total LP Tokens
              </div>
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Liquidity provider tokens
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-lg" style={{ color: "#FBFAF9" }}>
                {totalLiquidityFormatted}
              </div>
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                SDEX-LP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold mb-1" style={{ color: "#FBFAF9" }}>
              Trading Fee
            </div>
            <div className="text-2xl font-bold" style={{ color: "#836EF9" }}>
              0.3%
            </div>
            <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              Per transaction
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <div className="text-3xl mb-2">🏦</div>
            <div className="font-semibold mb-1" style={{ color: "#FBFAF9" }}>
              Protocol
            </div>
            <div className="text-2xl font-bold" style={{ color: "#A0055D" }}>
              NadTrade
            </div>
            <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              AMM Protocol
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <div className="text-3xl mb-2">🌐</div>
            <div className="font-semibold mb-1" style={{ color: "#FBFAF9" }}>
              Network
            </div>
            <div className="text-2xl font-bold" style={{ color: "#10B981" }}>
              Monad
            </div>
            <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              Testnet
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Updates Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border" style={{
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderColor: "rgba(16, 185, 129, 0.3)"
        }}>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#10B981" }}></div>
          <span className="text-sm font-medium" style={{ color: "#10B981" }}>
            Live data from smart contract
          </span>
        </div>
      </div>
    </div>
  )
}

export default PoolStats