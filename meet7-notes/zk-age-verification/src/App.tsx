import '@rainbow-me/rainbowkit/styles.css'
import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { monadTestnet } from './config/chains'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

import KTPInputForm from './components/KTPInputForm'
import ZKProofDisplay from './components/ZKProofDisplay'
import Header from './components/Header'

import type { KTPData, KTPProofInput, AgeProofOutput } from './types/ktp'
import { ZKProofGenerator } from './lib/zkProof'
import { SnarkjsLoader } from './lib/snarkjsLoader'
import { AGE_VERIFIER_ABI, AGE_VERIFIER_ADDRESS } from './constants'

// Wagmi configuration
const config = getDefaultConfig({
  appName: 'ZK Age Verification',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [monadTestnet],
  ssr: true,
});

const queryClient = new QueryClient()

// Helper function to convert string arrays to bigint tuples
const convertProofParams = (proof: AgeProofOutput) => {
  // Convert string arrays to bigint arrays and ensure proper tuple types
  const pA: [bigint, bigint] = [
    BigInt(proof.proof.pi_a[0]), 
    BigInt(proof.proof.pi_a[1])
  ];
  
  const pB: [[bigint, bigint], [bigint, bigint]] = [
    [BigInt(proof.proof.pi_b[0][0]), BigInt(proof.proof.pi_b[0][1])],
    [BigInt(proof.proof.pi_b[1][0]), BigInt(proof.proof.pi_b[1][1])]
  ];
  
  const pC: [bigint, bigint] = [
    BigInt(proof.proof.pi_c[0]), 
    BigInt(proof.proof.pi_c[1])
  ];
  
  const publicSignals: [bigint, bigint] = [
    BigInt(proof.publicSignals[0]), 
    BigInt(proof.publicSignals[1])
  ];

  return { pA, pB, pC, publicSignals };
};

function ZKAgeVerificationApp() {
  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()
  
  const [step, setStep] = useState<'input' | 'proof' | 'verified'>('input')
  const [zkProof, setZKProof] = useState<AgeProofOutput | null>(null)
  const [isAdult, setIsAdult] = useState(false)
  const [commitment, setCommitment] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationTx, setVerificationTx] = useState('')
  const [snarkjsLoaded, setSnarkjsLoaded] = useState(false)
  const [snarkjsLoading, setSnarkjsLoading] = useState(false)

  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({
    hash: verificationTx as `0x${string}`,
  })

  // Load SnarkJS on component mount
  useEffect(() => {
    const loadSnarkJS = async () => {
      if (SnarkjsLoader.isLoaded()) {
        setSnarkjsLoaded(true)
        return
      }

      setSnarkjsLoading(true)
      try {
        await SnarkjsLoader.preload(3) // 3 retries
        setSnarkjsLoaded(true)
        toast.success('ZK proof system ready!')
      } catch (error) {
        console.error('Failed to load SnarkJS:', error)
        toast.error('Failed to load ZK proof system. Some features may not work.')
      } finally {
        setSnarkjsLoading(false)
      }
    }

    loadSnarkJS()
  }, [])

  const handleKTPSubmit = async (data: KTPData) => {
    setIsGenerating(true)

    try {
      // Check if SnarkJS is loaded
      if (!snarkjsLoaded) {
        // Try to load SnarkJS one more time
        toast.loading('Loading ZK proof system...')
        await SnarkjsLoader.load()
        setSnarkjsLoaded(true)
        toast.dismiss()
      }

      // Parse birth date
      const { day, month, year } = ZKProofGenerator.parseBirthDate(data.tanggalLahir)
      
      // Calculate age to check if >= 18
      const currentAge = ZKProofGenerator.calculateAge(data.tanggalLahir)
      setIsAdult(currentAge >= 18)

      // Generate salt for privacy
      const salt = ZKProofGenerator.generateSalt()

      // Create proof input
      const proofInput: KTPProofInput = {
        birthDay: day,
        birthMonth: month,
        birthYear: year,
        currentYear: new Date().getFullYear(),
        salt: salt
      }

      // Generate commitment
      const commitmentHash = await ZKProofGenerator.createCommitment(
        day, month, year, salt
      )
      setCommitment(commitmentHash)
      
      let proof: AgeProofOutput
        // Generate real ZK proof
        const zkGenerator = new ZKProofGenerator()
        // eslint-disable-next-line prefer-const
        proof = await zkGenerator.generateAgeProof(proofInput)
        toast.success('ZK proof generated successfully!')
      
      
      setZKProof(proof)
      setStep('proof')

    } catch (error) {
      console.error('Error generating proof:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('snarkjs')) {
        toast.error('ZK proof system not available. Please refresh and try again.')
      } else {
        toast.error('Failed to generate ZK proof: ' + errorMessage)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVerifyOnChain = async () => {
    if (!zkProof || !isConnected || !address) {
      toast.error('Please connect wallet first')
      return
    }

    setIsVerifying(true)

    try {
      // Convert proof parameters to proper types
      const { pA, pB, pC, publicSignals } = convertProofParams(zkProof)

      const hash = await writeContractAsync({
        address: AGE_VERIFIER_ADDRESS,
        abi: AGE_VERIFIER_ABI,
        functionName: 'verifyAge',
        args: [pA, pB, pC, publicSignals],
      })

      setVerificationTx(hash)
      setStep('verified')
      
      toast.success('Age verification submitted to blockchain!')

    } catch (error) {
      console.error('Error verifying on-chain:', error)
      toast.error('Failed to verify on blockchain')
    } finally {
      setIsVerifying(false)
    }
  }

  const resetFlow = () => {
    setStep('input')
    setZKProof(null)
    setIsAdult(false)
    setCommitment('')
    setVerificationTx('')
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="glass card-hover rounded-2xl p-12 max-w-2xl mx-auto text-center">
          <div className="text-8xl mb-6 float-animation">🆔</div>
          <h2 className="text-4xl font-bold mb-6 text-gradient-monad">
            Zero-Knowledge Age Verification
          </h2>
          <p className="mb-8 text-lg leading-relaxed" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
            Prove you're over 18 using Indonesian KTP data without revealing any personal information. Powered by advanced cryptography and zero-knowledge proofs.
          </p>
          
          {/* SnarkJS Loading Status */}
          {snarkjsLoading && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span className="text-blue-400">Loading ZK proof system...</span>
              </div>
            </div>
          )}
          
          {!snarkjsLoading && !snarkjsLoaded && (
            <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-yellow-400 text-sm">
                ⚠️ ZK proof system not loaded. Some features may use fallback methods.
              </p>
            </div>
          )}
          
          {snarkjsLoaded && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <p className="text-green-400 text-sm">
                ✅ ZK proof system ready!
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: "rgba(131, 110, 249, 0.1)",
              borderColor: "rgba(131, 110, 249, 0.3)"
            }}>
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2" style={{ color: "#FBFAF9" }}>Complete Privacy</h3>
              <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Zero personal data is revealed or stored
              </p>
            </div>
            
            <div className="p-6 rounded-xl border" style={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderColor: "rgba(16, 185, 129, 0.3)"
            }}>
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2" style={{ color: "#FBFAF9" }}>Instant Verification</h3>
              <p className="text-sm" style={{ color: "rgba(251, 250, 249, 0.7)" }}>
                Mathematical proof generated in seconds
              </p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium mb-4" style={{ color: "#836EF9" }}>
              Connect your wallet to begin verification
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { step: 'input', label: 'Input KTP', icon: '📄' },
              { step: 'proof', label: 'Generate Proof', icon: '🔐' },
              { step: 'verified', label: 'Blockchain Verification', icon: '✅' }
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  step === item.step 
                    ? 'border-purple-500 bg-purple-500/20 text-purple-400' 
                    : index < ['input', 'proof', 'verified'].indexOf(step)
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-gray-500 bg-gray-500/20 text-gray-500'
                }`}>
                  <span className="text-lg">{item.icon}</span>
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`font-medium ${
                    step === item.step ? 'text-purple-400' :
                    index < ['input', 'proof', 'verified'].indexOf(step) ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </div>
                </div>
                {index < 2 && (
                  <div className={`w-16 h-px mx-4 ${
                    index < ['input', 'proof', 'verified'].indexOf(step) ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 'input' && (
          <KTPInputForm 
            onSubmit={handleKTPSubmit}
            isLoading={isGenerating}
          />
        )}

        {step === 'proof' && zkProof && (
          <ZKProofDisplay
            proof={zkProof}
            isAdult={isAdult}
            commitment={commitment}
            onVerifyOnChain={handleVerifyOnChain}
            isVerifying={isVerifying || isTxLoading}
            verificationTx={verificationTx}
          />
        )}

        {step === 'verified' && (
          <div className="text-center">
            <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: "#FBFAF9" }}>
                Verification Complete!
              </h2>
              <p className="text-lg mb-6" style={{ color: "rgba(251, 250, 249, 0.8)" }}>
                Your age has been successfully verified on the Monad blockchain using zero-knowledge cryptography.
              </p>
              
              {verificationTx && (
                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-green-400 mb-2">Transaction Hash:</p>
                  <a 
                    href={`https://testnet.monadexplorer.com/tx/${verificationTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-300 hover:text-green-200 font-mono text-xs break-all"
                  >
                    {verificationTx}
                  </a>
                </div>
              )}
              
              <button
                onClick={resetFlow}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-200 btn-primary"
                style={{
                  background: "linear-gradient(135deg, #836EF9 0%, #A0055D 100%)",
                  color: "#FBFAF9"
                }}
              >
                Start New Verification
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen">
            <Header />
            <ZKAgeVerificationApp />
          </div>
          <Toaster position="top-center" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App