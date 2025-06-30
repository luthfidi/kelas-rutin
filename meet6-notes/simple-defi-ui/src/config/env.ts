// Environment configuration with validation
const requiredEnvVars = {
  VITE_SIMPLE_DEX_ADDRESS: import.meta.env.VITE_SIMPLE_DEX_ADDRESS,
  VITE_CAMPUS_COIN_ADDRESS: import.meta.env.VITE_CAMPUS_COIN_ADDRESS,
  VITE_MOCK_USDC_ADDRESS: import.meta.env.VITE_MOCK_USDC_ADDRESS,
  VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
} as const;

// Check if we're in production
const isProduction = import.meta.env.PROD;

// Fallback values (only for development)
const fallbackValues = {
  VITE_SIMPLE_DEX_ADDRESS: "0x493185ee6e21b69a6782960E0f35aEEfF2a2F8a2",
  VITE_CAMPUS_COIN_ADDRESS: "0x39b5aC632F550b0f3cD39180c0912e29DBc68De3",
  VITE_MOCK_USDC_ADDRESS: "0x3DA1769802400490E47C8D20fee171D81c89d208",
  VITE_WALLETCONNECT_PROJECT_ID: "1f2d078ead13b88fe9541028cd7b0368",
} as const;

// Validate environment variables
function validateEnv() {
  const missing: string[] = [];
  
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    const errorMsg = `❌ Missing environment variables: ${missing.join(', ')}`;
    
    if (isProduction) {
      // In production, throw error
      throw new Error(errorMsg);
    } else {
      // In development, warn and use fallbacks
      console.warn(errorMsg);
      console.warn('🔄 Using fallback values for development...');
    }
  }
}

// Run validation
validateEnv();

// Export configuration with fallbacks
export const ENV = {
  SIMPLE_DEX_ADDRESS: requiredEnvVars.VITE_SIMPLE_DEX_ADDRESS || fallbackValues.VITE_SIMPLE_DEX_ADDRESS,
  CAMPUS_COIN_ADDRESS: requiredEnvVars.VITE_CAMPUS_COIN_ADDRESS || fallbackValues.VITE_CAMPUS_COIN_ADDRESS,
  MOCK_USDC_ADDRESS: requiredEnvVars.VITE_MOCK_USDC_ADDRESS || fallbackValues.VITE_MOCK_USDC_ADDRESS,
  WALLETCONNECT_PROJECT_ID: requiredEnvVars.VITE_WALLETCONNECT_PROJECT_ID || fallbackValues.VITE_WALLETCONNECT_PROJECT_ID,
  IS_PRODUCTION: isProduction,
} as const;

// Debug info
if (!isProduction) {
  console.log('🔧 Environment Configuration:', ENV);
}