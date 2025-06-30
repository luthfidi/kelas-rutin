"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, Plus, Minus, ExternalLink, Search, RefreshCw } from "lucide-react"
import { useAccount } from "wagmi"
import { useRecentSwaps, useLiquidityEvents, useIndexerHealth, useManualRefresh } from "../hooks/useIndexerData"
import { formatTime, formatAddress, formatNumber } from "../utils/formatters"
import type { SwapData, LiquidityEventData } from "../hooks/useIndexerData"

interface CombinedTransaction {
  id: string
  type: 'swap' | 'add_liquidity' | 'remove_liquidity'
  user: string
  timestamp: string
  transactionHash: string
  blockNumber: string
  data: SwapData | LiquidityEventData
}

const TransactionHistory = () => {
  const { address } = useAccount()
  const [filter, setFilter] = useState<'all' | 'swap' | 'add_liquidity' | 'remove_liquidity'>('all')
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch data from indexer
  const { data: recentSwaps, isLoading: swapsLoading, error: swapsError } = useRecentSwaps(50)
  const { data: liquidityEvents, isLoading: liquidityLoading, error: liquidityError } = useLiquidityEvents(50)
  const { data: indexerHealth } = useIndexerHealth()
  const { refreshAll } = useManualRefresh()

  // Manual refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAll()
    } catch (error) {
      console.error('Failed to refresh data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Combine and process transactions
  const combinedTransactions = useMemo(() => {
    const combined: CombinedTransaction[] = []

    // Add swaps
    if (recentSwaps) {
      recentSwaps.forEach((swap: SwapData) => {
        combined.push({
          id: `swap_${swap.id}`,
          type: 'swap',
          user: swap.user,
          timestamp: swap.timestamp,
          transactionHash: swap.transactionHash,
          blockNumber: swap.blockNumber,
          data: swap
        })
      })
    }

    // Add liquidity events
    if (liquidityEvents) {
      liquidityEvents.forEach((event: LiquidityEventData) => {
        combined.push({
          id: `liquidity_${event.id}`,
          type: event.type === 'ADD' ? 'add_liquidity' : 'remove_liquidity',
          user: event.provider,
          timestamp: event.timestamp,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          data: event
        })
      })
    }

    // Sort by timestamp (newest first)
    return combined.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
  }, [recentSwaps, liquidityEvents])

  // Process data for filtering
  const filteredTransactions = useMemo(() => {
    return combinedTransactions.filter((tx: CombinedTransaction) => {
      const matchesFilter = filter === 'all' || tx.type === filter
      const matchesSearch = !searchTerm || 
        tx.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transactionHash.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesFilter && matchesSearch
    })
  }, [combinedTransactions, filter, searchTerm])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#836EF9" }} />
      case 'add_liquidity':
        return <Plus className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#10B981" }} />
      case 'remove_liquidity':
        return <Minus className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#EF4444" }} />
      default:
        return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#836EF9" }} />
    }
  }

  const getTransactionDescription = (tx: CombinedTransaction) => {
    if (tx.type === 'swap') {
      const swapData = tx.data as SwapData
      
      // Handle different token names from our contracts
      const getTokenSymbol = (tokenName: string) => {
        if (tokenName === 'CampusCoin') return 'CAMP'
        if (tokenName === 'MockUSDC') return 'USDC'
        return tokenName
      }

      const getTokenDecimals = (tokenName: string) => {
        if (tokenName === 'CampusCoin') return 18
        if (tokenName === 'MockUSDC') return 6
        return 18
      }

      const tokenInSymbol = getTokenSymbol(swapData.tokenIn)
      const tokenOutSymbol = getTokenSymbol(swapData.tokenOut)
      const tokenInDecimals = getTokenDecimals(swapData.tokenIn)
      const tokenOutDecimals = getTokenDecimals(swapData.tokenOut)

      const amountInFormatted = (Number(swapData.amountIn) / Math.pow(10, tokenInDecimals)).toFixed(
        tokenInDecimals === 18 ? 4 : 2
      )
      const amountOutFormatted = (Number(swapData.amountOut) / Math.pow(10, tokenOutDecimals)).toFixed(
        tokenOutDecimals === 18 ? 4 : 2
      )

      return `${amountInFormatted} ${tokenInSymbol} → ${amountOutFormatted} ${tokenOutSymbol}`
    } else {
      const liquidityData = tx.data as LiquidityEventData
      
      const amountA = (Number(liquidityData.amountA) / Math.pow(10, 18)).toFixed(4) // CAMP
      const amountB = (Number(liquidityData.amountB) / Math.pow(10, 6)).toFixed(2)  // USDC
      const liquidityAmount = (Number(liquidityData.liquidity) / Math.pow(10, 18)).toFixed(4)

      if (tx.type === 'add_liquidity') {
        return `Add ${amountA} CAMP + ${amountB} USDC (${liquidityAmount} LP)`
      } else {
        return `Remove ${amountA} CAMP + ${amountB} USDC (${liquidityAmount} LP)`
      }
    }
  }

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'swap':
        return 'Swap'
      case 'add_liquidity':
        return 'Add Liquidity'
      case 'remove_liquidity':
        return 'Remove Liquidity'
      default:
        return 'Transaction'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'swap':
        return {
          bg: "rgba(131, 110, 249, 0.1)",
          border: "rgba(131, 110, 249, 0.3)",
          color: "#836EF9"
        }
      case 'add_liquidity':
        return {
          bg: "rgba(16, 185, 129, 0.1)",
          border: "rgba(16, 185, 129, 0.3)",
          color: "#10B981"
        }
      case 'remove_liquidity':
        return {
          bg: "rgba(239, 68, 68, 0.1)",
          border: "rgba(239, 68, 68, 0.3)",
          color: "#EF4444"
        }
      default:
        return {
          bg: "rgba(131, 110, 249, 0.1)",
          border: "rgba(131, 110, 249, 0.3)",
          color: "#836EF9"
        }
    }
  }

  const isLoading = swapsLoading || liquidityLoading
  const hasError = swapsError || liquidityError

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-0">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl">
          <div className="text-center py-12">
            <div className="spinner w-8 h-8 mx-auto mb-4"></div>
            <div className="text-lg font-semibold mb-2" style={{ color: "#FBFAF9" }}>
              Loading indexed data...
            </div>
            <div style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              Fetching from Ponder indexer
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-0">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <div className="text-lg font-semibold mb-2" style={{ color: "#FBFAF9" }}>
              Indexer Connection Error
            </div>
            <div style={{ color: "rgba(251, 250, 249, 0.7)" }} className="mb-4">
              Could not connect to Ponder GraphQL endpoint
            </div>
            <div className="text-sm" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
              Error: {(swapsError || liquidityError)?.message || 'Unknown error'}
            </div>
            {indexerHealth && !indexerHealth.isHealthy && (
              <div className="text-sm mt-2" style={{ color: "rgba(245, 158, 11, 0.8)" }}>
                Indexer Status: Unhealthy
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-0">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "#FBFAF9" }}>
              Transaction History
            </h2>
            <div className="px-2 py-1 rounded text-xs font-medium" style={{
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              color: "#10B981"
            }}>
              Live Indexer Data
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "rgba(131, 110, 249, 0.1)",
                borderColor: "rgba(131, 110, 249, 0.3)",
                color: "#836EF9"
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ 
                backgroundColor: "rgba(14, 16, 15, 0.5)",
                borderColor: "rgba(251, 250, 249, 0.2)",
                color: "#FBFAF9"
              }}
            >
              <option value="all">All Transactions</option>
              <option value="swap">Swaps Only</option>
              <option value="add_liquidity">Add Liquidity</option>
              <option value="remove_liquidity">Remove Liquidity</option>
            </select>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search address or hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border input-primary text-sm w-full sm:w-64"
                style={{ 
                  backgroundColor: "rgba(14, 16, 15, 0.5)",
                  borderColor: "rgba(251, 250, 249, 0.2)",
                  color: "#FBFAF9"
                }}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                style={{ color: "rgba(251, 250, 249, 0.7)" }} />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: "#FBFAF9" }}>
                No transactions found
              </h3>
              <p className="text-sm sm:text-base" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                {combinedTransactions.length === 0 
                  ? "No transactions have been indexed yet. Try making a swap or providing liquidity!" 
                  : "Try adjusting your filters or search terms."}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx: CombinedTransaction) => {
              const colors = getTransactionColor(tx.type)
              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl border hover:bg-white/5 transition-all duration-200 card-hover space-y-3 sm:space-y-0"
                  style={{
                    backgroundColor: "rgba(14, 16, 15, 0.3)",
                    borderColor: "rgba(251, 250, 249, 0.1)"
                  }}
                >
                  {/* Transaction Info */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: colors.bg,
                        borderColor: colors.border
                      }}
                    >
                      {getTransactionIcon(tx.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                          {getTransactionTypeLabel(tx.type)}
                        </span>
                        {tx.user.toLowerCase() === address?.toLowerCase() && (
                          <span className="text-xs px-2 py-1 rounded-full border whitespace-nowrap" style={{
                            backgroundColor: "rgba(16, 185, 129, 0.1)",
                            borderColor: "rgba(16, 185, 129, 0.3)",
                            color: "#10B981"
                          }}>
                            You
                          </span>
                        )}
                        {tx.type === 'swap' && (tx.data as SwapData).priceImpact && (tx.data as SwapData).priceImpact! > 3 && (
                          <span className="text-xs px-2 py-1 rounded-full border whitespace-nowrap" style={{
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            borderColor: "rgba(245, 158, 11, 0.3)",
                            color: "#F59E0B"
                          }}>
                            High Impact
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                        {getTransactionDescription(tx)}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
                        {formatTime(Number(tx.timestamp) * 1000)} • {formatAddress(tx.user)}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {/* Additional Info */}
                    <div className="text-right">
                      {tx.type === 'swap' && (
                        <>
                          <div className="text-xs sm:text-sm font-medium" style={{ 
                            color: ((tx.data as SwapData).priceImpact && (tx.data as SwapData).priceImpact! > 3) ? "#F59E0B" : "#10B981"
                          }}>
                            {(tx.data as SwapData).priceImpact ? `${Number((tx.data as SwapData).priceImpact).toFixed(2)}% Impact` : 'N/A'}
                          </div>
                          <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
                            Gas: {formatNumber(Number((tx.data as SwapData).gasUsed))}
                          </div>
                        </>
                      )}
                      {(tx.type === 'add_liquidity' || tx.type === 'remove_liquidity') && (
                        <>
                          <div className="text-xs sm:text-sm font-medium" style={{ color: colors.color }}>
                            {((tx.data as LiquidityEventData).shareOfPool * 100).toFixed(2)}% of Pool
                          </div>
                          <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
                            Block: {formatNumber(Number(tx.blockNumber))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* External Link */}
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${tx.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: "rgba(251, 250, 249, 0.7)" }}
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                    </a>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Indexer Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-2 text-xs sm:text-sm text-center space-y-1 sm:space-y-0 mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${indexerHealth?.isHealthy ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
            <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              🔗 Indexed by Ponder
            </span>
          </div>
          <span className="hidden sm:inline" style={{ color: "rgba(251, 250, 249, 0.5)" }}>•</span>
          <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            Auto-refresh: 30s intervals
          </span>
          <span className="hidden sm:inline" style={{ color: "rgba(251, 250, 249, 0.5)" }}>•</span>
          <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            {filteredTransactions.length} transactions indexed
          </span>
          {indexerHealth?.lastUpdated && (
            <>
              <span className="hidden sm:inline" style={{ color: "rgba(251, 250, 249, 0.5)" }}>•</span>
              <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Last updated: {formatTime(Number(indexerHealth.lastUpdated) * 1000)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TransactionHistory