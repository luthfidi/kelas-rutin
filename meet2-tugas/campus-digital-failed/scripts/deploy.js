const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Starting Campus Digital Token Suite Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get balance - Fixed syntax for Hardhat v2
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");
  console.log("🌐 Network:", hre.network.name);
  console.log("");

  // Check minimum balance
  const minBalance = hre.ethers.parseEther("0.01");
  if (balance < minBalance) {
    console.log("❌ Insufficient balance for deployment");
    console.log("💡 You need at least 0.01 ETH for gas fees");
    return;
  }

  // Deploy CampusCredit (ERC-20)
  console.log("📍 Deploying CampusCredit (ERC-20)...");
  const CampusCredit = await hre.ethers.getContractFactory("CampusCredit");
  const campusCredit = await CampusCredit.deploy();
  await campusCredit.waitForDeployment();
  const campusCreditAddress = await campusCredit.getAddress();
  console.log("✅ CampusCredit deployed to:", campusCreditAddress);
  console.log("");

  // Deploy StudentID (ERC-721)
  console.log("📍 Deploying StudentID (ERC-721)...");
  const StudentID = await hre.ethers.getContractFactory("StudentID");
  const studentID = await StudentID.deploy();
  await studentID.waitForDeployment();
  const studentIDAddress = await studentID.getAddress();
  console.log("✅ StudentID deployed to:", studentIDAddress);
  console.log("");

  // Deploy CourseBadge (ERC-1155)
  console.log("📍 Deploying CourseBadge (ERC-1155)...");
  const CourseBadge = await hre.ethers.getContractFactory("CourseBadge");
  const courseBadge = await CourseBadge.deploy();
  await courseBadge.waitForDeployment();
  const courseBadgeAddress = await courseBadge.getAddress();
  console.log("✅ CourseBadge deployed to:", courseBadgeAddress);
  console.log("");

  // Setup initial configurations
  console.log("⚙️ Setting up initial configurations...");
  
  try {
    // Register sample merchant for CampusCredit
    console.log("- Registering sample merchant...");
    const merchantTx = await campusCredit.registerMerchant(
      "0x742d35Cc6634C0532925a3b8D0E7C4C9bE8B9112",
      "Kafetaria Kampus"
    );
    await merchantTx.wait();
    
    // Set daily limit for deployer
    console.log("- Setting daily spending limit...");
    const limitTx = await campusCredit.setDailyLimit(
      deployer.address,
      hre.ethers.parseEther("100") // 100 CREDIT daily limit
    );
    await limitTx.wait();

    console.log("✅ Initial setup completed!\n");
  } catch (error) {
    console.log("⚠️ Initial setup skipped (may require manual setup)");
    console.log("Error:", error.message);
  }

  // Save addresses to file for verification
  const addresses = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || "unknown",
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      CampusCredit: campusCreditAddress,
      StudentID: studentIDAddress,
      CourseBadge: courseBadgeAddress
    }
  };

  fs.writeFileSync('deployed-addresses.json', JSON.stringify(addresses, null, 2));
  console.log("💾 Contract addresses saved to deployed-addresses.json");

  // Display contract addresses
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 Chain ID:", hre.network.config.chainId || "unknown");
  console.log("👤 Deployer:", deployer.address);
  console.log("");
  console.log("📄 CONTRACT ADDRESSES:");
  console.log("🏦 CampusCredit (ERC-20):", campusCreditAddress);
  console.log("🆔 StudentID (ERC-721):", studentIDAddress);
  console.log("🏆 CourseBadge (ERC-1155):", courseBadgeAddress);
  console.log("=".repeat(60));

  // Display explorer links
  let explorerBase;
  if (hre.network.name === "monad") {
    explorerBase = "https://testnet-explorer.monad.xyz/address";
  } else if (hre.network.name === "sepolia") {
    explorerBase = "https://sepolia.etherscan.io/address";
  }

  if (explorerBase) {
    console.log("\n🔗 EXPLORER LINKS:");
    console.log(`🏦 CampusCredit: ${explorerBase}/${campusCreditAddress}`);
    console.log(`🆔 StudentID: ${explorerBase}/${studentIDAddress}`);
    console.log(`🏆 CourseBadge: ${explorerBase}/${courseBadgeAddress}`);
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Wait 1-2 minutes for block confirmations");
  console.log("2. Run verification: npm run verify");
  console.log("3. Test contracts functionality");
  console.log("4. Update frontend with new contract addresses");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });