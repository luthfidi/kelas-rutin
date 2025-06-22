import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🌐 Checking Monad Testnet Connection");
  console.log("=" .repeat(40));
  
  try {
    // Check network info
    const network = await ethers.provider.getNetwork();
    console.log("✅ Network Name:", network.name);
    console.log("✅ Chain ID:", network.chainId.toString());
    
    // Check block number
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ Latest Block:", blockNumber);
    
    // Check deployer account
    const [deployer] = await ethers.getSigners();
    console.log("✅ Deployer Address:", deployer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("✅ Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance < ethers.parseEther("0.01")) {
      console.log("⚠️ Warning: Low balance! You might need more ETH for deployment");
      console.log("💡 Get testnet ETH from Monad faucet");
    } else {
      console.log("✅ Sufficient balance for deployment");
    }
    
    console.log("\n🎉 Network connection successful!");
    console.log("Ready to deploy CampusCredit!");
    
  } catch (error) {
    console.error("❌ Network connection failed:", error);
    console.log("\n💡 Troubleshooting:");
    console.log("1. Check internet connection");
    console.log("2. Verify private key is set: npx hardhat vars get PRIVATE_KEY");
    console.log("3. Ensure Monad RPC is accessible");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });