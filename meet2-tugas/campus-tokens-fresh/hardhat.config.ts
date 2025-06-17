import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { vars } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
    },
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz/",
      chainId: 10143,
      accounts: vars.has("PRIVATE_KEY") ? [`0x${vars.get("PRIVATE_KEY")}`] : [],
      gasPrice: "auto",
      timeout: 120000,
    }
  },
  
  // Enable Sourcify for Monad
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet-explorer.monad.xyz",
  },
  
  // Disable etherscan to avoid conflicts
  etherscan: {
    enabled: false,
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;