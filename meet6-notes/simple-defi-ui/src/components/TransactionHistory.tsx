"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowUpDown, Plus, Minus, ExternalLink, Filter, Search, RefreshCw } from "lucide-react"
import { useAccount, useWatchContractEvent, usePublicClient } from "wagmi"
import { SIMPLE_DEX_ABI, CONTRACTS } from "../constants"
import { formatTokenAmount, formatTime, formatAddress } from "../utils/formatters"
import type { TransactionHistory as TxHistory } from "../types/defi"

// Extended type for internal use with blockNumber
interface ExtendedTxHistory extends TxHistory {
  blockNumber?: number
}

interface SwapEventArgs {
  user: string
  amountIn: bigint
  amountOut: bigint
  tokenAtoB: boolean
}

interface LiquidityEventArgs {
  provider: string
  amountA: bigint
  amountB: bigint
  liquidity: bigint
}

const TransactionHistory = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<ExtendedTxHistory[]>([])
  const [filter, setFilter] = useState<'all' | 'swap' | 'add_liquidity' | 'remove_liquidity'>('all')
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetchedBlock, setLastFetchedBlock] = useState<bigint>(BigInt(0))

  // Fetch historical transactions from blockchain
  const fetchHistoricalTransactions = async (fromBlock?: bigint) => {
    if (!publicClient) return

    setIsLoading(true)
    
    try {
      const currentBlock = await publicClient.getBlockNumber()
      const startBlock = fromBlock || currentBlock - BigInt(50) // Only last 50 blocks
      
      console.log(`Fetching transactions from block ${startBlock} to ${currentBlock}`)

      // Fetch all event types in parallel (no batching needed for 50 blocks)
      const [swapEvents, liquidityAddedEvents, liquidityRemovedEvents] = await Promise.all([
        // Fetch Swap events
        publicClient.getLogs({
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
          fromBlock: startBlock,
          toBlock: currentBlock,
        }),

        // Fetch LiquidityAdded events
        publicClient.getLogs({
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
          fromBlock: startBlock,
          toBlock: currentBlock,
        }),

        // Fetch LiquidityRemoved events
        publicClient.getLogs({
          address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
          event: {
            type: 'event',
            name: 'LiquidityRemoved',
            inputs: [
              { name: 'provider', type:'address', indexed: true },
              { name: 'amountA', type: 'uint256', indexed: false },
              { name: 'amountB', type: 'uint256', indexed: false },
              { name: 'liquidity', type: 'uint256', indexed: false }
            ]
          },
          fromBlock: startBlock,
          toBlock: currentBlock,
        })
      ])

      console.log(`Found ${swapEvents.length} swaps, ${liquidityAddedEvents.length} liquidity adds, ${liquidityRemovedEvents.length} liquidity removes`)

      // Process all events and get their block timestamps
      const allTransactions: ExtendedTxHistory[] = []

      // Process swap events
      for (const log of swapEvents) {
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          const args = log.args as SwapEventArgs

          const newTx: ExtendedTxHistory = {
            id: `${log.transactionHash}-${log.logIndex}`,
            type: 'swap',
            hash: log.transactionHash || '',
            timestamp: Number(block.timestamp) * 1000, // Convert to milliseconds
            user: args.user,
            tokenA: {
              symbol: args.tokenAtoB ? 'CAMP' : 'USDC',
              amount: formatTokenAmount(
                args.amountIn,
                args.tokenAtoB ? 'CAMP' : 'USDC'
              )
            },
            tokenB: {
              symbol: args.tokenAtoB ? 'USDC' : 'CAMP',
              amount: formatTokenAmount(
                args.amountOut,
                args.tokenAtoB ? 'USDC' : 'CAMP'
              )
            },
            status: 'success',
            blockNumber: Number(log.blockNumber)
          }

          allTransactions.push(newTx)
        } catch (error) {
          console.error('Error processing swap event:', error)
        }
      }

      // Process liquidity added events
      for (const log of liquidityAddedEvents) {
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          const args = log.args as LiquidityEventArgs

          const newTx: ExtendedTxHistory = {
            id: `${log.transactionHash}-${log.logIndex}`,
            type: 'add_liquidity',
            hash: log.transactionHash || '',
            timestamp: Number(block.timestamp) * 1000,
            user: args.provider,
            tokenA: {
              symbol: 'CAMP',
              amount: formatTokenAmount(args.amountA, 'CAMP')
            },
            tokenB: {
              symbol: 'USDC',
              amount: formatTokenAmount(args.amountB, 'USDC')
            },
            lpTokens: formatTokenAmount(args.liquidity, 'CAMP'),
            status: 'success',
            blockNumber: Number(log.blockNumber)
          }

          allTransactions.push(newTx)
        } catch (error) {
          console.error('Error processing liquidity added event:', error)
        }
      }

      // Process liquidity removed events
      for (const log of liquidityRemovedEvents) {
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          const args = log.args as LiquidityEventArgs

          const newTx: ExtendedTxHistory = {
            id: `${log.transactionHash}-${log.logIndex}`,
            type: 'remove_liquidity',
            hash: log.transactionHash || '',
            timestamp: Number(block.timestamp) * 1000,
            user: args.provider,
            tokenA: {
              symbol: 'CAMP',
              amount: formatTokenAmount(args.amountA, 'CAMP')
            },
            tokenB: {
              symbol: 'USDC',
              amount: formatTokenAmount(args.amountB, 'USDC')
            },
            lpTokens: formatTokenAmount(args.liquidity, 'CAMP'),
            status: 'success',
            blockNumber: Number(log.blockNumber)
          }

          allTransactions.push(newTx)
        } catch (error) {
          console.error('Error processing liquidity removed event:', error)
        }
      }

      // Sort by timestamp (newest first) and remove duplicates
      const sortedTransactions = allTransactions
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter((tx, index, self) => index === self.findIndex(t => t.id === tx.id))

      console.log(`Processed ${sortedTransactions.length} total transactions`)

      // Update state
      if (fromBlock) {
        // If fetching newer transactions, prepend them
        setTransactions(prev => {
          const combined = [...sortedTransactions, ...prev]
          const unique = combined.filter((tx, index, self) => 
            index === self.findIndex(t => t.id === tx.id)
          )
          return unique.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50) // Keep only 50 transactions
        })
      } else {
        // If fetching initial data, replace all
        setTransactions(sortedTransactions.slice(0, 50)) // Keep only 50 transactions
      }

      setLastFetchedBlock(currentBlock)

    } catch (error) {
      console.error('Error fetching historical transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch historical data on component mount
  const fetchHistoricalTransactionsCallback = useCallback(fetchHistoricalTransactions, [publicClient])
  
  useEffect(() => {
    if (publicClient && transactions.length === 0) {
      fetchHistoricalTransactionsCallback()
    }
  }, [publicClient, fetchHistoricalTransactionsCallback, transactions.length])

  // Watch for new swap events
  useWatchContractEvent({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    eventName: 'Swap',
    onLogs(logs) {
      logs.forEach(async (log) => {
        if ('args' in log && log.args) {
          try {
            const args = log.args as SwapEventArgs
            const block = await publicClient?.getBlock({ blockNumber: log.blockNumber! })
            
            if (!block) return

            const newTx: ExtendedTxHistory = {
              id: `${log.transactionHash}-${log.logIndex}`,
              type: 'swap',
              hash: log.transactionHash || '',
              timestamp: Number(block.timestamp) * 1000,
              user: args.user,
              tokenA: {
                symbol: args.tokenAtoB ? 'CAMP' : 'USDC',
                amount: formatTokenAmount(
                  args.amountIn,
                  args.tokenAtoB ? 'CAMP' : 'USDC'
                )
              },
              tokenB: {
                symbol: args.tokenAtoB ? 'USDC' : 'CAMP',
                amount: formatTokenAmount(
                  args.amountOut,
                  args.tokenAtoB ? 'USDC' : 'CAMP'
                )
              },
              status: 'success',
              blockNumber: Number(log.blockNumber)
            }

            setTransactions(prev => {
              const exists = prev.find(tx => tx.id === newTx.id)
              if (!exists) {
                return [newTx, ...prev].slice(0, 50) // Keep only 50 transactions
              }
              return prev
            })
          } catch (error) {
            console.error('Error processing new swap event:', error)
          }
        }
      })
    }
  })

  // Watch for new liquidity events
  useWatchContractEvent({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    eventName: 'LiquidityAdded',
    onLogs(logs) {
      logs.forEach(async (log) => {
        if ('args' in log && log.args) {
          try {
            const args = log.args as LiquidityEventArgs
            const block = await publicClient?.getBlock({ blockNumber: log.blockNumber! })
            
            if (!block) return

            const newTx: ExtendedTxHistory = {
              id: `${log.transactionHash}-${log.logIndex}`,
              type: 'add_liquidity',
              hash: log.transactionHash || '',
              timestamp: Number(block.timestamp) * 1000,
              user: args.provider,
              tokenA: {
                symbol: 'CAMP',
                amount: formatTokenAmount(args.amountA, 'CAMP')
              },
              tokenB: {
                symbol: 'USDC',
                amount: formatTokenAmount(args.amountB, 'USDC')
              },
              lpTokens: formatTokenAmount(args.liquidity, 'CAMP'),
              status: 'success',
              blockNumber: Number(log.blockNumber)
            }

            setTransactions(prev => {
              const exists = prev.find(tx => tx.id === newTx.id)
              if (!exists) {
                return [newTx, ...prev].slice(0, 50) // Keep only 50 transactions
              }
              return prev
            })
          } catch (error) {
            console.error('Error processing new liquidity added event:', error)
          }
        }
      })
    }
  })

  useWatchContractEvent({
    address: CONTRACTS.SIMPLE_DEX as `0x${string}`,
    abi: SIMPLE_DEX_ABI,
    eventName: 'LiquidityRemoved',
    onLogs(logs) {
      logs.forEach(async (log) => {
        if ('args' in log && log.args) {
          try {
            const args = log.args as LiquidityEventArgs
            const block = await publicClient?.getBlock({ blockNumber: log.blockNumber! })
            
            if (!block) return

            const newTx: ExtendedTxHistory = {
              id: `${log.transactionHash}-${log.logIndex}`,
              type: 'remove_liquidity',
              hash: log.transactionHash || '',
              timestamp: Number(block.timestamp) * 1000,
              user: args.provider,
              tokenA: {
                symbol: 'CAMP',
                amount: formatTokenAmount(args.amountA, 'CAMP')
              },
              tokenB: {
                symbol: 'USDC',
                amount: formatTokenAmount(args.amountB, 'USDC')
              },
              lpTokens: formatTokenAmount(args.liquidity, 'CAMP'),
              status: 'success',
              blockNumber: Number(log.blockNumber)
            }

            setTransactions(prev => {
              const exists = prev.find(tx => tx.id === newTx.id)
              if (!exists) {
                return [newTx, ...prev].slice(0, 50) // Keep only 50 transactions
              }
              return prev
            })
          } catch (error) {
            console.error('Error processing new liquidity removed event:', error)
          }
        }
      })
    }
  })

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter = filter === 'all' || tx.type === filter
    const matchesSearch = !searchTerm || 
      tx.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#836EF9" }} />
      case 'add_liquidity':
        return <Plus className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#10B981" }} />
      case 'remove_liquidity':
        return <Minus className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "#EF4444" }} />
      default:
        return <ArrowUpDown className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "rgba(251, 250, 249, 0.7)" }} />
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'swap':
        return 'Swap'
      case 'add_liquidity':
        return 'Add Liquidity'
      case 'remove_liquidity':
        return 'Remove Liquidity'
      default:
        return 'Unknown'
    }
  }

  const getTransactionDescription = (tx: ExtendedTxHistory) => {
    switch (tx.type) {
      case 'swap':
        return `${tx.tokenA?.amount} ${tx.tokenA?.symbol} → ${tx.tokenB?.amount} ${tx.tokenB?.symbol}`
      case 'add_liquidity':
        return `${tx.tokenA?.amount} ${tx.tokenA?.symbol} + ${tx.tokenB?.amount} ${tx.tokenB?.symbol}`
      case 'remove_liquidity':
        return `${tx.tokenA?.amount} ${tx.tokenA?.symbol} + ${tx.tokenB?.amount} ${tx.tokenB?.symbol}`
      default:
        return ''
    }
  }

  const handleRefresh = () => {
    fetchHistoricalTransactions(lastFetchedBlock)
  }

  const loadMoreTransactions = () => {
    const oldestBlock = transactions.length > 0 
      ? Math.min(...transactions.filter(tx => tx.blockNumber).map(tx => tx.blockNumber!))
      : 0
    
    if (oldestBlock > 0) {
      fetchHistoricalTransactions(BigInt(oldestBlock - 50)) // Fetch 50 blocks before oldest
    }
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
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "rgba(251, 250, 249, 0.7)" }}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="appearance-none bg-transparent border rounded-lg px-3 py-2 pr-8 input-primary text-sm w-full sm:w-auto"
                style={{ 
                  color: "#FBFAF9",
                  borderColor: "rgba(251, 250, 249, 0.2)",
                  backgroundColor: "rgba(14, 16, 15, 0.5)"
                }}
              >
                <option value="all">All Transactions</option>
                <option value="swap">Swaps</option>
                <option value="add_liquidity">Add Liquidity</option>
                <option value="remove_liquidity">Remove Liquidity</option>
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none" 
                style={{ color: "rgba(251, 250, 249, 0.7)" }} />
            </div>

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

        {/* Loading State */}
        {isLoading && transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="spinner w-8 h-8 mx-auto mb-4"></div>
            <div className="text-lg font-semibold mb-2" style={{ color: "#FBFAF9" }}>
              Loading transaction history...
            </div>
            <div style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              Fetching events from blockchain
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div className="space-y-3 sm:space-y-4">
          {!isLoading && filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: "#FBFAF9" }}>
                No transactions found
              </h3>
              <p className="text-sm sm:text-base" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                {transactions.length === 0 
                  ? "No transactions have been made yet on this DEX!" 
                  : "Try adjusting your filters or search terms."}
              </p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
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
                      backgroundColor: "rgba(131, 110, 249, 0.1)",
                      borderColor: "rgba(131, 110, 249, 0.3)"
                    }}
                  >
                    {getTransactionIcon(tx.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm sm:text-base" style={{ color: "#FBFAF9" }}>
                        {getTransactionLabel(tx.type)}
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
                    </div>
                    <div className="text-xs sm:text-sm mb-1" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                      {getTransactionDescription(tx)}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(251, 250, 249, 0.5)" }}>
                      {formatTime(tx.timestamp)} • {formatAddress(tx.user)}
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.status === 'success' ? 'bg-green-500' :
                      tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-xs sm:text-sm capitalize" style={{ 
                      color: tx.status === 'success' ? "#10B981" :
                             tx.status === 'pending' ? "#F59E0B" : "#EF4444"
                    }}>
                      {tx.status}
                    </span>
                  </div>

                  {/* External Link */}
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: "rgba(251, 250, 249, 0.7)" }}
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
            ))
          )}

          {/* Load More Button */}
          {!isLoading && filteredTransactions.length >= 10 && (
            <div className="text-center pt-4">
              <button
                onClick={loadMoreTransactions}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 btn-primary text-sm sm:text-base"
                style={{
                  background: "linear-gradient(135deg, rgba(131, 110, 249, 0.2), rgba(160, 5, 93, 0.2))",
                  border: "1px solid rgba(131, 110, 249, 0.3)",
                  color: "#FBFAF9"
                }}
              >
                Load Previous 50 Blocks
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {transactions.length > 0 && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 rounded-lg border" style={{
                backgroundColor: "rgba(14, 16, 15, 0.3)",
                borderColor: "rgba(251, 250, 249, 0.1)"
              }}>
                <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#FBFAF9" }}>
                  {transactions.length}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Total Transactions
                </div>
              </div>
              
              <div className="text-center p-3 rounded-lg border" style={{
                backgroundColor: "rgba(14, 16, 15, 0.3)",
                borderColor: "rgba(251, 250, 249, 0.1)"
              }}>
                <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#836EF9" }}>
                  {transactions.filter(tx => tx.type === 'swap').length}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Swaps
                </div>
              </div>
              
              <div className="text-center p-3 rounded-lg border" style={{
                backgroundColor: "rgba(14, 16, 15, 0.3)",
                borderColor: "rgba(251, 250, 249, 0.1)"
              }}>
                <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#10B981" }}>
                  {transactions.filter(tx => tx.type === 'add_liquidity').length}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Liquidity Added
                </div>
              </div>
              
              <div className="text-center p-3 rounded-lg border" style={{
                backgroundColor: "rgba(14, 16, 15, 0.3)",
                borderColor: "rgba(251, 250, 249, 0.1)"
              }}>
                <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#EF4444" }}>
                  {transactions.filter(tx => tx.type === 'remove_liquidity').length}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                  Liquidity Removed
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center sm:space-x-2 text-xs sm:text-sm text-center space-y-1 sm:space-y-0 mt-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#10B981" }}></div>
            <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
              🔗 Real blockchain transactions
            </span>
          </div>
          <span className="hidden sm:inline" style={{ color: "rgba(251, 250, 249, 0.5)" }}>•</span>
          <span style={{ color: "rgba(251, 250, 249, 0.7)" }}>
            Live updates from events
          </span>
        </div>
      </div>
    </div>
  )
}

export default TransactionHistory