import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying CampusCredit to Monad Testnet");
  console.log("=" .repeat(50));

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");
  
  // Check minimum balance
  if (balance < ethers.parseEther("0.01")) {
    console.log("❌ Insufficient balance! Need at least 0.01 ETH");
    return;
  }
  
  console.log("🌐 Network:", hre.network.name);
  console.log("⛓️ Chain ID:", hre.network.config.chainId);
  console.log("");

  // Deploy CampusCredit
  console.log("📦 Deploying CampusCredit...");
  
  const CampusCredit = await ethers.getContractFactory("CampusCredit");
  const campusCredit = await CampusCredit.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await campusCredit.waitForDeployment();
  
  const address = await campusCredit.getAddress();
  console.log("✅ CampusCredit deployed to:", address);
  
  // Wait for block confirmations
  console.log("⏳ Waiting 60 seconds for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Basic contract interaction test
  console.log("\n🧪 Testing contract functions...");
  try {
    const name = await campusCredit.name();
    const symbol = await campusCredit.symbol();
    const totalSupply = await campusCredit.totalSupply();
    const deployerBalance = await campusCredit.balanceOf(deployer.address);
    
    console.log("📊 Contract Details:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
    console.log(`   Deployer Balance: ${ethers.formatEther(deployerBalance)} ${symbol}`);
  } catch (error) {
    console.log("⚠️ Contract interaction test failed:", error);
  }
  
  // Try verification
  console.log("\n🔍 Attempting contract verification...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified") || 
        error.message.includes("already verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.log("❌ Verification failed:", error.message);
      console.log("💡 You can try manual verification later");
    }
  }
  
  // Save deployment info
  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contract: {
      name: "CampusCredit",
      address: address,
      verified: true // Update based on verification result
    },
    compiler: {
      version: "0.8.26",
      optimization: true,
      runs: 200
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync('campus-credit-deployment.json', JSON.stringify(deploymentData, null, 2));
  
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(50));
  console.log("🏦 CampusCredit Address:", address);
  console.log("🔗 Explorer Link:", `https://testnet-explorer.monad.xyz/address/${address}`);
  console.log("💾 Deployment data saved to: campus-credit-deployment.json");
  
  console.log("\n🎉 CampusCredit deployment completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Verify the contract on explorer (if auto-verification failed)");
  console.log("2. Test contract functions");
  console.log("3. Deploy StudentID and CourseBadge contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });