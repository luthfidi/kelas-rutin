// Contract addresses (updated with deployed addresses from Monad Testnet)
export const AGE_VERIFIER_ADDRESS = "0xd80e970e135b153561372205c6549dde4573cf5e" as const
export const GROTH16_VERIFIER_ADDRESS = "0xfebc62db781f3800ccc4330ee84f7b7b3526c5a7" as const

// Network configuration
export const MONAD_TESTNET_CHAIN_ID = 10143
export const MONAD_TESTNET_RPC = "https://testnet-rpc.monad.xyz/"
export const MONAD_TESTNET_EXPLORER = "https://testnet.monadexplorer.com"

// ABI untuk Age Verifier Contract
export const AGE_VERIFIER_ABI = [{"inputs":[{"internalType":"address","name":"_verifier","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"commitment","type":"uint256"},{"indexed":false,"internalType":"bool","name":"isAdult","type":"bool"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"AgeVerified","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"VerificationRevoked","type":"event"},{"inputs":[{"internalType":"address[]","name":"users","type":"address[]"}],"name":"batchCheckVerification","outputs":[{"internalType":"bool[]","name":"results","type":"bool[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getVerificationTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"commitment","type":"uint256"}],"name":"isCommitmentUsed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"isVerifiedAdult","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"revokeVerification","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"usedCommitments","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"verificationTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"verifiedAdults","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"verifier","outputs":[{"internalType":"contract Groth16Verifier","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[2]","name":"_pA","type":"uint256[2]"},{"internalType":"uint256[2][2]","name":"_pB","type":"uint256[2][2]"},{"internalType":"uint256[2]","name":"_pC","type":"uint256[2]"},{"internalType":"uint256[2]","name":"_publicSignals","type":"uint256[2]"}],"name":"verifyAge","outputs":[],"stateMutability":"nonpayable","type":"function"}] as const

// Helper URLs
export const EXPLORER_TX_URL = (txHash: string) => 
  `${MONAD_TESTNET_EXPLORER}/tx/${txHash}`

export const EXPLORER_ADDRESS_URL = (address: string) => 
  `${MONAD_TESTNET_EXPLORER}/address/${address}`

// Contract deployment info
export const DEPLOYMENT_INFO = {
  network: "Monad Testnet",
  chainId: MONAD_TESTNET_CHAIN_ID,
  contracts: {
    ageVerifier: {
      address: AGE_VERIFIER_ADDRESS,
      explorer: EXPLORER_ADDRESS_URL(AGE_VERIFIER_ADDRESS)
    },
    groth16Verifier: {
      address: GROTH16_VERIFIER_ADDRESS,
      explorer: EXPLORER_ADDRESS_URL(GROTH16_VERIFIER_ADDRESS)
    }
  }
} as const