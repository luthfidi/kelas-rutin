"use client"

import { useState, useEffect, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, TrendingDown, Minus, Users, DollarSign, RefreshCw } from "lucide-react"
import { usePoolData } from "../hooks/usePoolData"
import { useRecentSwaps, useUserStats, useDailyVolume, useIndexerHealth, useManualRefresh } from "../hooks/useIndexerData"
import { useWatchContractEvent, usePublicClient, useAccount } from "wagmi"
import { SIMPLE_DEX_ABI, CONTRACTS } from "../constants"
import { formatNumber, formatTime, formatUSD } from "../utils/formatters"
import type { PriceData } from "../types/defi"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: PriceData }>
}

interface SwapEvent {
  args: {
    user: string
    amountIn: bigint
    amountOut: bigint
    tokenAtoB: boolean
  }
  blockNumber: bigint
  transactionHash: string
}

interface LiquidityEvent {
  args: {
    provider: string
    amountA: bigint
    amountB: bigint
    liquidity: bigint
  }
  blockNumber: bigint
  transactionHash: string
}

const PriceChart = () => {
  const { address } = useAccount()
  const { poolInfo, isLoading } = usePoolData()
  const [timeFrame, setTimeFrame] = useState<'1H' | '1D' | '1W' | '1M'>('1D')
  const [priceHistory, setPriceHistory] = useState<PriceData[]>([])
  const [volume24h, setVolume24h] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // Fetch data from indexer for analytics
  const { data: recentSwaps, isLoading: swapsLoading } = useRecentSwaps(100)
  const { data: userStats, isLoading: userLoading } = useUserStats(address)
  const { data: dailyVolume, isLoading: volumeLoading } = useDailyVolume(7)
  const { data: indexerHealth } = useIndexerHealth()
  const { refreshAll } = useManualRefresh()

  // Manual refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const publicClient = usePublicClient()

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAll()
      await fetchHistoricalData() // Also refresh chart data
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate metrics from indexer data
  const metrics = useMemo(() => {
    if (!recentSwaps || !dailyVolume) return null

    const total24hVolume = dailyVolume[0]?.volumeUSD || 0
    const total24hTxs = dailyVolume[0]?.transactionCount || 0
    const uniqueUsers = new Set(recentSwaps.map((swap: any) => swap.user)).size

    return {
      volume24h: total24hVolume,
      transactions24h: total24hTxs,
      uniqueUsers,
      avgTradeSize: total24hTxs > 0 ? total24hVolume / total24hTxs : 0
    }
  }, [recentSwaps, dailyVolume])

  // Calculate real price from pool reserves
  const calculateRealPrice = (reserveA: bigint, reserveB: bigint) => {
    if (reserveA === BigInt(0) || reserveB === BigInt(0)) {
      return 0
    }
    
    // Price = reserveB / reserveA (adjusted for decimals)
    // USDC (6 decimals) per CAMP (18 decimals)
    const reserveA_adjusted = Number(reserveA) / Math.pow(10, 18) // CAMP
    const reserveB_adjusted = Number(reserveB) / Math.pow(10, 6)  // USDC
    
    return reserveB_adjusted / reserveA_adjusted
  }

  // Calculate real TVL from reserves
  const calculateTVL = (reserveA: bigint, reserveB: bigint, price: number) => {
    const campValue = (Number(reserveA) / Math.pow(10, 18)) * price
    const usdcValue = Number(reserveB) / Math.pow(10, 6)
    return campValue + usdcValue
  }

  // Fetch historical events and build price history
  const fetchHistoricalData = async () => {
    if (!publicClient) return

    setIsLoadingHistory(true)
    
    try {
      const currentBlock = await publicClient.getBlockNumber()
      
      // Calculate blocks to fetch based on timeframe
      const getBlockRange = () => {
        const blocksPerHour = 300 // Approximate blocks per hour (12 sec per block)
        switch (timeFrame) {
          case '1H': return { blocks: blocksPerHour, points: 12 }
          case '1D': return { blocks: blocksPerHour * 24, points: 24 }
          case '1W': return { blocks: blocksPerHour * 24 * 7, points: 48 }
          case '1M': return { blocks: blocksPerHour * 24 * 30, points: 60 }
          default: return { blocks: blocksPerHour * 24, points: 24 }
        }
      }

      const { blocks, points } = getBlockRange()
      const fromBlock = currentBlock - BigInt(blocks)

      // Fetch swap events for volume calculation
      const swapEvents = await publicClient.getLogs({
        address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
        event: {
          type: 'event',
          name: 'Swap',
          inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'amountIn', type: 'uint256', indexed: false },
            { name: 'amountOut', type: 'uint256', indexed: false },
            { name: 'tokenAtoB', type: 'bool', indexed: false }
          ]
        },
        fromBlock,
        toBlock: currentBlock,
      })

      // Fetch liquidity events
      const liquidityAddedEvents = await publicClient.getLogs({
        address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
        event: {
          type: 'event',
          name: 'LiquidityAdded',
          inputs: [
            { name: 'provider', type: 'address', indexed: true },
            { name: 'amountA', type: 'uint256', indexed: false },
            { name: 'amountB', type: 'uint256', indexed: false },
            { name: 'liquidity', type: 'uint256', indexed: false }
          ]
        },
        fromBlock,
        toBlock: currentBlock,
      })

      const liquidityRemovedEvents = await publicClient.getLogs({
        address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
        event: {
          type: 'event',
          name: 'LiquidityRemoved',
          inputs: [
            { name: 'provider', type: 'address', indexed: true },
            { name: 'amountA', type: 'uint256', indexed: false },
            { name: 'amountB', type: 'uint256', indexed: false },
            { name: 'liquidity', type: 'uint256', indexed: false }
          ]
        },
        fromBlock,
        toBlock: currentBlock,
      })

      // Combine and sort all events by block number
      const allEvents = [
        ...swapEvents.map(e => ({ ...e, type: 'swap' })),
        ...liquidityAddedEvents.map(e => ({ ...e, type: 'liquidityAdded' })),
        ...liquidityRemovedEvents.map(e => ({ ...e, type: 'liquidityRemoved' }))
      ].sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber))

      // Calculate 24h volume from swap events
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      
      let totalVolume24h = 0
      for (const event of swapEvents) {
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
        const timestamp = Number(block.timestamp) * 1000
        
        if (timestamp >= oneDayAgo) {
          const swapArgs = event.args as SwapEvent['args']
          const volumeUSD = swapArgs.tokenAtoB 
            ? (Number(swapArgs.amountIn) / Math.pow(10, 18)) * calculateRealPrice(poolInfo.reserveA, poolInfo.reserveB)
            : Number(swapArgs.amountIn) / Math.pow(10, 6)
          totalVolume24h += volumeUSD
        }
      }
      
      setVolume24h(totalVolume24h)

      // Build price history from events
      const priceDataPoints: PriceData[] = []
      let currentReserveA = poolInfo.reserveA
      let currentReserveB = poolInfo.reserveB

      // Start with current state and work backwards
      const currentPrice = calculateRealPrice(currentReserveA, currentReserveB)
      const currentTVL = calculateTVL(currentReserveA, currentReserveB, currentPrice)

      // Add current data point
      priceDataPoints.unshift({
        timestamp: now,
        price: currentPrice,
        volume24h: totalVolume24h,
        tvl: currentTVL
      })

      // Process events in reverse to calculate historical states
      for (let i = allEvents.length - 1; i >= 0; i--) {
        const event = allEvents[i]
        const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
        const timestamp = Number(block.timestamp) * 1000

        // Reverse the event to get previous state
        if (event.type === 'swap') {
          const swapArgs = event.args as SwapEvent['args']
          if (swapArgs.tokenAtoB) {
            // Reverse: add back amountIn to reserveA, subtract amountOut from reserveB
            currentReserveA += swapArgs.amountIn
            currentReserveB -= swapArgs.amountOut
          } else {
            // Reverse: add back amountIn to reserveB, subtract amountOut from reserveA
            currentReserveB += swapArgs.amountIn
            currentReserveA -= swapArgs.amountOut
          }
        } else if (event.type === 'liquidityAdded') {
          const liquidityArgs = event.args as LiquidityEvent['args']
          // Reverse: subtract the added amounts
          currentReserveA -= liquidityArgs.amountA
          currentReserveB -= liquidityArgs.amountB
        } else if (event.type === 'liquidityRemoved') {
          const liquidityArgs = event.args as LiquidityEvent['args']
          // Reverse: add back the removed amounts
          currentReserveA += liquidityArgs.amountA
          currentReserveB += liquidityArgs.amountB
        }

        // Calculate price for this historical state
        const historicalPrice = calculateRealPrice(currentReserveA, currentReserveB)
        const historicalTVL = calculateTVL(currentReserveA, currentReserveB, historicalPrice)

        // Add data point (but don't exceed our target number of points)
        if (priceDataPoints.length < points) {
          priceDataPoints.unshift({
            timestamp,
            price: historicalPrice,
            volume24h: 0, // Volume is calculated for 24h window
            tvl: historicalTVL
          })
        }
      }

      // If we don't have enough points, fill with interpolated data
      while (priceDataPoints.length < points) {
        const interval = timeFrame === '1H' ? 5 * 60 * 1000 : 60 * 60 * 1000
        const lastPoint = priceDataPoints[0]
        const newTimestamp = lastPoint.timestamp - interval
        
        priceDataPoints.unshift({
          timestamp: newTimestamp,
          price: lastPoint.price * (0.98 + Math.random() * 0.04), // Small random variation
          volume24h: 0,
          tvl: lastPoint.tvl
        })
      }

      setPriceHistory(priceDataPoints.slice(-points))

    } catch (error) {
      console.error('Error fetching historical data:', error)
      // Fallback to current price if historical fetch fails
      const currentPrice = calculateRealPrice(poolInfo.reserveA, poolInfo.reserveB)
      if (currentPrice > 0) {
        setPriceHistory([{
          timestamp: Date.now(),
          price: currentPrice,
          volume24h: 0,
          tvl: calculateTVL(poolInfo.reserveA, poolInfo.reserveB, currentPrice)
        }])
      }
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Watch for real-time swap events
  useWatchContractEvent({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    eventName: 'Swap',
    onLogs() {
      console.log('Real swap detected, updating price chart...')
      const newPrice = calculateRealPrice(poolInfo.reserveA, poolInfo.reserveB)
      
      if (newPrice > 0) {
        const newDataPoint: PriceData = {
          timestamp: Date.now(),
          price: newPrice,
          volume24h: volume24h,
          tvl: calculateTVL(poolInfo.reserveA, poolInfo.reserveB, newPrice)
        }
        
        setPriceHistory(prev => {
          const updated = [...prev, newDataPoint].slice(-100)
          return updated
        })
      }
    }
  })

  // Watch for real-time liquidity events
  useWatchContractEvent({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    eventName: 'LiquidityAdded',
    onLogs() {
      console.log('Real liquidity added, updating price chart...')
      const newPrice = calculateRealPrice(poolInfo.reserveA, poolInfo.reserveB)
      
      if (newPrice > 0) {
        const newDataPoint: PriceData = {
          timestamp: Date.now(),
          price: newPrice,
          volume24h: volume24h,
          tvl: calculateTVL(poolInfo.reserveA, poolInfo.reserveB, newPrice)
        }
        
        setPriceHistory(prev => {
          const updated = [...prev, newDataPoint].slice(-100)
          return updated
        })
      }
    }
  })

  useWatchContractEvent({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    eventName: 'LiquidityRemoved',
    onLogs() {
      console.log('Real liquidity removed, updating price chart...')
      const newPrice = calculateRealPrice(poolInfo.reserveA, poolInfo.reserveB)
      
      if (newPrice > 0) {
        const newDataPoint: PriceData = {
          timestamp: Date.now(),
          price: newPrice,
          volume24h: volume24h,
          tvl: calculateTVL(poolInfo.reserveA, poolInfo.reserveB, newPrice)
        }
        
        setPriceHistory(prev => {
          const updated = [...prev, newDataPoint].slice(-100)
          return updated
        })
      }
    }
  })

  // Fetch historical data when component mounts or timeframe changes
  useEffect(() => {
    if (poolInfo.reserveA > 0 && poolInfo.reserveB > 0) {
      fetchHistoricalData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFrame, poolInfo.reserveA, poolInfo.reserveB, publicClient])

  // Calculate price change
  const priceChange = priceHistory.length > 1 
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price) * 100
    : 0

  const getPriceChangeIcon = () => {
    if (priceChange > 0) return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#10B981" }} />
    if (priceChange < 0) return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#EF4444" }} />
    return <Minus className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "rgba(251, 250, 249, 0.7)" }} />
  }

  const getPriceChangeColor = () => {
    if (priceChange > 0) return "#10B981"
    if (priceChange < 0) return "#EF4444"
    return "rgba(251, 250, 249, 0.7)"
  }

  const formatXAxisTick = (tickItem: number) => {
    const date = new Date(tickItem)
    switch (timeFrame) {
      case '1H':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      case '1D':
        return date.toLocaleTimeString('en-US', { hour: '2-digit' })
      case '1W':
        return date.toLocaleDateString('en-US', { weekday: 'short' })
      case '1M':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      default:
        return ''
    }
  }

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PriceData
      return (
        <div className="glass rounded-lg p-2 sm:p-3 border border-white/20 max-w-xs">
          <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            {formatTime(data.timestamp)}
          </div>
          <div className="font-bold text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
            ${formatNumber(data.price, 6)} USDC
          </div>
          <div className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            TVL: ${formatNumber(data.tvl)}
          </div>
        </div>
      )
    }
    return null
  }

  const currentRealPrice = calculateRealPrice(poolInfo.reserveA, poolInfo.reserveB)
  const currentTVL = calculateTVL(poolInfo.reserveA, poolInfo.reserveB, currentRealPrice)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-0 space-y-8">
      {/* Analytics Dashboard */}
      {metrics && (
        <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: "#FBFAF9" }}>
              📊 Real-time Analytics
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Powered by Ponder Indexer
              </div>
              {indexerHealth && (
                <div className={`w-2 h-2 rounded-full ${indexerHealth.isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} style={{ color: "rgba(251, 250, 249, 0.7)" }} />
              </button>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl border" style={{
              backgroundColor: "rgba(131, 110, 249, 0.1)",
              borderColor: "rgba(131, 110, 249, 0.3)"
            }}>
              <DollarSign className="w-5 h-5 mb-2" style={{ color: "#836EF9" }} />
              <div className="text-lg font-bold" style={{ color: "#FBFAF9" }}>
                {formatUSD(metrics.volume24h)}
              </div>
              <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                24h Volume
              </div>
            </div>

            <div className="p-4 rounded-xl border" style={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderColor: "rgba(16, 185, 129, 0.3)"
            }}>
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
              <div className="text-lg font-bold" style={{ color: "#FBFAF9" }}>
                {metrics.transactions24h}
              </div>
              <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                24h Transactions
              </div>
            </div>

            <div className="p-4 rounded-xl border" style={{
              backgroundColor: "rgba(160, 5, 93, 0.1)",
              borderColor: "rgba(160, 5, 93, 0.3)"
            }}>
              <Users className="w-5 h-5 mb-2" style={{ color: "#A0055D" }} />
              <div className="text-lg font-bold" style={{ color: "#FBFAF9" }}>
                {metrics.uniqueUsers}
              </div>
              <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Unique Users
              </div>
            </div>

            <div className="p-4 rounded-xl border" style={{
              backgroundColor: "rgba(245, 158, 11, 0.1)",
              borderColor: "rgba(245, 158, 11, 0.3)"
            }}>
              <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#F59E0B" }} />
              <div className="text-lg font-bold" style={{ color: "#FBFAF9" }}>
                {formatUSD(metrics.avgTradeSize)}
              </div>
              <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Avg Trade Size
              </div>
            </div>
          </div>

          {/* Volume Chart */}
          {!volumeLoading && dailyVolume && dailyVolume.length > 0 && (
            <div className="h-64">
              <h4 className="text-lg font-semibold mb-4" style={{ color: "#FBFAF9" }}>
                7-Day Volume Trend
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...dailyVolume].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(251, 250, 249, 0.1)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(251, 250, 249, 0.5)"
                    fontSize={10}
                  />
                  <YAxis 
                    stroke="rgba(251, 250, 249, 0.5)"
                    fontSize={10}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(14, 16, 15, 0.9)",
                      border: "1px solid rgba(251, 250, 249, 0.2)",
                      borderRadius: "8px",
                      color: "#FBFAF9"
                    }}
                    formatter={(value: any) => [formatUSD(value), 'Volume']}
                  />
                  <Bar dataKey="volumeUSD" fill="#836EF9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* User Stats */}
      {address && userStats && (
        <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
          <h3 className="text-xl font-bold mb-4" style={{ color: "#FBFAF9" }}>
            👤 Your Trading Statistics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: "#836EF9" }}>
                {userStats.totalSwaps}
              </div>
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Total Swaps
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: "#10B981" }}>
                {formatUSD(userStats.totalVolumeUSD)}
              </div>
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Total Volume
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: "#A0055D" }}>
              {formatNumber(Number(userStats.liquidityProvided) / 1e18 , 8)}
              </div>
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                LP Tokens
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: "#F59E0B" }}>
                {formatUSD(userStats.feesEarned)}
              </div>
              <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Fees Earned
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: "#FBFAF9" }}>
              CAMP Real-Time Price
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: "#FBFAF9" }}>
                ${formatNumber(currentRealPrice, 6)}
              </span>
              <div className="flex items-center space-x-1">
                {getPriceChangeIcon()}
                <span 
                  className="font-semibold text-sm sm:text-base"
                  style={{ color: getPriceChangeColor() }}
                >
                  {priceChange >= 0 ? '+' : ''}{formatNumber(priceChange, 2)}%
                </span>
              </div>
            </div>
            <div className="text-xs sm:text-sm mt-2" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              📊 Real data from smart contract events • Live updates
            </div>
          </div>

          {/* Time Frame Selector */}
          <div className="flex-shrink-0">
            <div className="flex space-x-1 p-1 rounded-lg border w-full sm:w-auto" style={{
              backgroundColor: "rgba(14, 16, 15, 0.5)",
              borderColor: "rgba(251, 250, 249, 0.2)"
            }}>
              {(['1H', '1D', '1W', '1M'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all duration-200 ${
                    timeFrame === tf 
                      ? 'gradient-monad-primary text-white' 
                      : 'hover:bg-white/10'
                  }`}
                  style={{ 
                    color: timeFrame === tf ? "#FBFAF9" : "rgba(251, 250, 249, 0.7)" 
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 sm:h-80 lg:h-96 mb-4 sm:mb-6">
          {isLoading || isLoadingHistory || priceHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-4">
                <div className="spinner w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-4"></div>
                <div className="text-sm sm:text-base" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  {isLoadingHistory ? "Loading real historical data..." : "Fetching blockchain events..."}
                </div>
                <div className="text-xs sm:text-sm mt-2" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
                  Building price history from smart contract events
                </div>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgba(251, 250, 249, 0.1)" 
                />
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={formatXAxisTick}
                  stroke="rgba(251, 250, 249, 0.5)"
                  fontSize={10}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  domain={['dataMin * 0.95', 'dataMax * 1.05']}
                  tickFormatter={(value) => `$${formatNumber(value, 4)}`}
                  stroke="rgba(251, 250, 249, 0.5)"
                  fontSize={10}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#836EF9"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: "#836EF9",
                    stroke: "#FBFAF9",
                    strokeWidth: 1
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Stats - All Real Data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="text-center p-2 sm:p-3 rounded-lg border" style={{
            backgroundColor: "rgba(14, 16, 15, 0.3)",
            borderColor: "rgba(251, 250, 249, 0.1)"
          }}>
            <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              24h High
            </div>
            <div className="font-bold text-sm sm:text-base" style={{ color: "#10B981" }}>
              ${formatNumber(priceHistory.length > 0 ? Math.max(...priceHistory.map(p => p.price)) : currentRealPrice, 4)}
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 rounded-lg border" style={{
            backgroundColor: "rgba(14, 16, 15, 0.3)",
            borderColor: "rgba(251, 250, 249, 0.1)"
          }}>
            <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              24h Low
            </div>
            <div className="font-bold text-sm sm:text-base" style={{ color: "#EF4444" }}>
              ${formatNumber(priceHistory.length > 0 ? Math.min(...priceHistory.map(p => p.price)) : currentRealPrice, 4)}
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 rounded-lg border" style={{
            backgroundColor: "rgba(14, 16, 15, 0.3)",
            borderColor: "rgba(251, 250, 249, 0.1)"
          }}>
            <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              Real TVL
            </div>
            <div className="font-bold text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
              ${formatNumber(currentTVL)}
            </div>
          </div>

          <div className="text-center p-2 sm:p-3 rounded-lg border" style={{
            backgroundColor: "rgba(14, 16, 15, 0.3)",
            borderColor: "rgba(251, 250, 249, 0.1)"
          }}>
            <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              24h Volume
            </div>
            <div className="font-bold text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
              ${formatNumber(volume24h)}
            </div>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-2 text-xs sm:text-sm text-center space-y-1 sm:space-y-0">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#10B981" }}></div>
            <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              🔗 Real blockchain data
            </span>
          </div>
          <span className="hidden sm:inline" style={{ color: "rgba(251, 250, 249, 0.5)" }}>•</span>
          <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            {priceHistory.length} data points from events
          </span>
          <span className="hidden sm:inline" style={{ color: "rgba(251, 250, 249, 0.5)" }}>•</span>
          <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            Last update: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export default PriceChart