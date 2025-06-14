import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying PemilihanBEM (Gas Price Fixed)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");

  // Get current gas price from network
  const feeData = await ethers.provider.getFeeData();
  console.log("Network gas price:", ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");

  const votingDuration = 300; // 5 minutes
  console.log("Voting duration:", votingDuration, "seconds");
  
  const PemilihanBEMFactory = await ethers.getContractFactory("PemilihanBEM");
  
  // Calculate recommended gas price (1.5x current)
  const gasPrice = feeData.gasPrice ? (feeData.gasPrice * BigInt(150)) / BigInt(100) : ethers.parseUnits("25", "gwei");
  console.log("Using gas price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  try {
    // Deploy with higher gas price
    const pemilihanBEM = await PemilihanBEMFactory.deploy(votingDuration, {
      gasLimit: 1000000, // 1M gas limit
      gasPrice: gasPrice  // Manual gas price
    });

    console.log("TX Hash:", pemilihanBEM.deploymentTransaction()?.hash);
    console.log("Waiting for deployment...");

    await pemilihanBEM.waitForDeployment();
    const contractAddress = await pemilihanBEM.getAddress();

    console.log("\n✅ Deployed successfully!");
    console.log("Contract Address:", contractAddress);
    console.log("Explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);

    // Get actual cost
    const deploymentTx = pemilihanBEM.deploymentTransaction();
    if (deploymentTx) {
      const receipt = await deploymentTx.wait();
      if (receipt) {
        const cost = receipt.gasUsed * receipt.gasPrice;
        console.log("\n💰 Deployment Cost:");
        console.log("Gas used:", receipt.gasUsed.toString());
        console.log("Gas price:", ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
        console.log("Total cost:", ethers.formatEther(cost), "MON");
      }
    }

    console.log("\n📋 Verify command:");
    console.log(`npx hardhat verify --network monadTestnet ${contractAddress} ${votingDuration}`);
    
    return contractAddress;

  } catch (error) {
    console.error("❌ Deployment error:", error);
    
    // Suggest solutions
    console.log("\n💡 Try these solutions:");
    console.log("1. Wait a few minutes and try again");
    console.log("2. Check Monad network status");
    console.log("3. Use higher gas price manually");
    console.log("4. Deploy to localhost for testing");
    
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });