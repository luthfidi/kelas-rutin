import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import { vars } from "hardhat/config";
import "hardhat-gas-reporter";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      metadata: {
        bytecodeHash: "none",
        useLiteralContent: true,
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    monadTestnet: {
      url: "https://testnet-rpc.monad.xyz/",
      chainId: 10143,
      accounts: vars.has("PRIVATE_KEY") ? [`0x${vars.get("PRIVATE_KEY")}`] : [],
      // Fix gas price settings
      gasPrice: 20000000000, // 20 gwei (naikan dari auto)
      gas: 2000000, // 2M gas limit
      timeout: 60000 // 60 second timeout
    }
  },
  etherscan: {
    enabled: false,
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
    outputFile: "gas-report.txt",
    noColors: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;