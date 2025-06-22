"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { TrendingUp, Droplets, BarChart3, History } from "lucide-react"
import SwapInterface from "./SwapInterface"
import LiquidityInterface from "./LiquidityInterface"
import PoolStats from "./PoolStats"
import PriceChart from "./PriceChart"
import TransactionHistory from "./TransactionHistory"

const DEXContainer = () => {
  const { isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity' | 'analytics' | 'history'>('swap')

  const TabButton = ({ 
    id, 
    icon, 
    label, 
    description 
  }: { 
    id: typeof activeTab, 
    icon: React.ReactNode, 
    label: string,
    description: string 
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 w-full text-left ${
        activeTab === id 
          ? 'gradient-monad-primary glow-purple' 
          : 'glass hover:bg-white/10'
      }`}
      style={{
        color: activeTab === id ? "#FBFAF9" : "rgba(251, 250, 249, 0.8)",
        border: activeTab === id ? "1px solid rgba(131, 110, 249, 0.5)" : "1px solid rgba(251, 250, 249, 0.1)"
      }}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-sm opacity-80">{description}</div>
      </div>
    </button>
  )

  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="glass card-hover rounded-2xl p-12 max-w-2xl mx-auto text-center">
          <div className="text-8xl mb-6 float-animation">
            <img src="/src/assets/image.png" alt="Nad Trade Logo" className="w-24 h-24 mx-auto mb-4" />
          </div>
          <h2 className="text-4xl font-bold mb-6 text-gradient-monad font-inter">
            Welcome to Nad Trade
          </h2>
          <p className="mb-8 text-lg leading-relaxed max-w-lg mx-auto" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
            The most intuitive decentralized exchange on Monad. Swap tokens, provide liquidity, and earn rewards with minimal fees and maximum efficiency.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: "rgba(131, 110, 249, 0.1)",
              borderColor: "rgba(131, 110, 249, 0.3)"
            }}>
              <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: "#836EF9" }} />
              <h3 className="font-semibold mb-2" style={{ color: "#FBFAF9" }}>Instant Swaps</h3>
              <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Trade tokens instantly with minimal slippage
              </p>
            </div>
            
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderColor: "rgba(16, 185, 129, 0.3)"
            }}>
              <Droplets className="w-8 h-8 mx-auto mb-3" style={{ color: "#10B981" }} />
              <h3 className="font-semibold mb-2" style={{ color: "#FBFAF9" }}>Earn Rewards</h3>
              <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Provide liquidity and earn trading fees
              </p>
            </div>
            
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: "rgba(160, 5, 93, 0.1)",
              borderColor: "rgba(160, 5, 93, 0.3)"
            }}>
              <BarChart3 className="w-8 h-8 mx-auto mb-3" style={{ color: "#A0055D" }} />
              <h3 className="font-semibold mb-2" style={{ color: "#FBFAF9" }}>Low Fees</h3>
              <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Only 0.3% trading fee on all swaps
              </p>
            </div>
          </div>

          <div className="flex justify-center items-center space-x-8 text-sm mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#10B981" }}></div>
              <span style={{ color: "rgba(251, 250, 249, 0.8)" }}>Live on Monad Testnet</span>
            </div>
            <div className="flex items-center space-x-2">
              <span style={{ color: "rgba(251, 250, 249, 0.8)" }}>Powered by AMM</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium mb-4" style={{ color: "#836EF9" }}>
              Connect your wallet to get started
            </p>
            <div className="flex justify-center items-center space-x-4 text-sm">
              <span style={{ color: "rgba(251, 250, 249, 0.6)" }}>Supported:</span>
              <span style={{ color: "#FBFAF9" }}>MetaMask</span>
              <span style={{ color: "rgba(251, 250, 249, 0.6)" }}>•</span>
              <span style={{ color: "#FBFAF9" }}>WalletConnect</span>
              <span style={{ color: "rgba(251, 250, 249, 0.6)" }}>•</span>
              <span style={{ color: "#FBFAF9" }}>Coinbase Wallet</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <TabButton
            id="swap"
            icon={<TrendingUp className="w-6 h-6" />}
            label="Swap"
            description="Trade tokens instantly"
          />
          <TabButton
            id="liquidity"
            icon={<Droplets className="w-6 h-6" />}
            label="Liquidity"
            description="Add or remove liquidity"
          />
          <TabButton
            id="analytics"
            icon={<BarChart3 className="w-6 h-6" />}
            label="Analytics"
            description="Pool stats and charts"
          />
          <TabButton
            id="history"
            icon={<History className="w-6 h-6" />}
            label="History"
            description="Transaction history"
          />
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'swap' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SwapInterface />
              <div className="space-y-8">
                <PoolStats />
              </div>
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <LiquidityInterface />
              <div className="space-y-8">
                <PoolStats />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <PriceChart />
              <PoolStats />
            </div>
          )}

          {activeTab === 'history' && (
            <TransactionHistory />
          )}
        </div>
      </div>
    </main>
  )
}

export default DEXContainer