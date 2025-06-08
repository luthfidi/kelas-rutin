import { ethers } from "hardhat";
import { DigitalWalletKampus } from "../typechain-types";

async function main() {
  console.log("🚀 Starting DigitalWalletKampus deployment to Monad Testnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployment Details:");
  console.log("├── Deployer address:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("├── Deployer balance:", ethers.formatEther(balance), "MON");
  
  if (balance < ethers.parseEther("0.01")) {
    console.log("⚠️  Warning: Low balance. Make sure you have enough MON for deployment.");
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("├── Network:", network.name);
  console.log("├── Chain ID:", network.chainId.toString());
  console.log("└── RPC URL:", "https://testnet-rpc.monad.xyz/\n");

  // Deploy DigitalWalletKampus
  console.log("📦 Deploying DigitalWalletKampus contract...");
  const DigitalWalletFactory = await ethers.getContractFactory("DigitalWalletKampus");
  
  // Estimate gas
  const deployTx = await DigitalWalletFactory.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  console.log("├── Estimated gas:", estimatedGas.toString());

  // Deploy with manual gas limit (adding 20% buffer)
  const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
  const digitalWallet: DigitalWalletKampus = await DigitalWalletFactory.deploy({
    gasLimit: gasLimit
  });

  console.log("├── Transaction hash:", digitalWallet.deploymentTransaction()?.hash);
  console.log("├── Waiting for deployment confirmation...");

  // Wait for deployment
  await digitalWallet.waitForDeployment();
  const contractAddress = await digitalWallet.getAddress();

  console.log("✅ DigitalWalletKampus deployed successfully!");
  console.log("├── Contract address:", contractAddress);
  console.log("├── Block explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);

  // Verify initial state
  console.log("\n🔍 Verifying initial contract state...");
  try {
    const admin = await digitalWallet.admin();
    const contractBalance = await digitalWallet.getContractBalance();
    const deployerBalance = await digitalWallet.balances(deployer.address);

    console.log("├── Admin:", admin);
    console.log("├── Contract balance:", ethers.formatEther(contractBalance), "MON");
    console.log("├── Deployer wallet balance:", ethers.formatEther(deployerBalance), "MON");
    
    // Test getBalance function
    const balance = await digitalWallet.getBalance(deployer.address);
    console.log("└── getBalance function test:", ethers.formatEther(balance), "MON");

  } catch (error) {
    console.log("❌ Error verifying contract state:", error);
  }

  // Get deployment cost
  const deploymentTx = digitalWallet.deploymentTransaction();
  if (deploymentTx) {
    const receipt = await deploymentTx.wait();
    if (receipt) {
      const cost = receipt.gasUsed * receipt.gasPrice;
      console.log("\n💰 Deployment Cost:");
      console.log("├── Gas used:", receipt.gasUsed.toString());
      console.log("├── Gas price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
      console.log("└── Total cost:", ethers.formatEther(cost), "MON");
    }
  }

  // Provide next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Save the contract address for future interactions");
  console.log("2. Verify the contract on block explorer using:");
  console.log(`   npx hardhat verify --network monadTestnet ${contractAddress}`);
  console.log("3. Test contract functions:");
  console.log("   - deposit() - Send MON to contract");
  console.log("   - transfer() - Transfer between users"); 
  console.log("   - withdraw() - Withdraw your balance");
  console.log("   - approveWithdrawal() - Admin approve withdrawal");
  console.log("4. Add the contract to your MetaMask for easy interaction");

  // Save deployment info to file
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    network: network.name,
    chainId: network.chainId.toString(),
    blockExplorer: `https://testnet.monadexplorer.com/address/${contractAddress}`,
    timestamp: new Date().toISOString(),
    txHash: deploymentTx?.hash
  };

  // Write to file (optional)
  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, 'digitalwallet-monad-testnet.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/digitalwallet-monad-testnet.json");
  
  return {
    digitalWallet,
    contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });