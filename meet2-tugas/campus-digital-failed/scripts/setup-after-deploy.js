const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("⚙️ Setting up contracts after deployment...\n");

  // Read deployment addresses from Ignition
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId;
  
  const deploymentPath = path.join(
    __dirname, 
    `../ignition/deployments/chain-${chainId}`,
    'deployed_addresses.json'
  );

  let addresses;
  try {
    const addressFile = fs.readFileSync(deploymentPath, 'utf8');
    addresses = JSON.parse(addressFile);
    console.log("📁 Loaded addresses from Ignition deployment");
  } catch (error) {
    console.log("❌ Deployment addresses not found!");
    console.log("Please run deployment first: npm run deploy:monad");
    return;
  }

  // Get contract addresses
  const campusCreditAddress = addresses["TokenSuiteModule#CampusCredit"];
  const studentIDAddress = addresses["TokenSuiteModule#StudentID"];
  const courseBadgeAddress = addresses["TokenSuiteModule#CourseBadge"];

  console.log("📄 Contract Addresses:");
  console.log("🏦 CampusCredit:", campusCreditAddress);
  console.log("🆔 StudentID:", studentIDAddress);
  console.log("🏆 CourseBadge:", courseBadgeAddress);
  console.log("");

  // Get signer
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // Get contract instances
  const CampusCredit = await hre.ethers.getContractFactory("CampusCredit");
  const campusCredit = CampusCredit.attach(campusCreditAddress);

  try {
    // Setup 1: Register merchant with proper checksummed address
    console.log("⚙️ Registering sample merchant...");
    
    // Use deployer address as merchant to avoid checksum issues
    const merchantTx = await campusCredit.registerMerchant(
      deployer.address, // Use deployer address (always valid)
      "Kafetaria Kampus"
    );
    await merchantTx.wait();
    console.log("✅ Merchant registered successfully!");

    // Setup 2: Set daily limit
    console.log("⚙️ Setting daily spending limit...");
    const limitTx = await campusCredit.setDailyLimit(
      deployer.address,
      hre.ethers.parseEther("100") // 100 CREDIT
    );
    await limitTx.wait();
    console.log("✅ Daily limit set successfully!");

    // Setup 3: Check total supply
    const totalSupply = await campusCredit.totalSupply();
    console.log("💰 Total Supply:", hre.ethers.formatEther(totalSupply), "CREDIT");

    // Setup 4: Check merchant registration
    const [isRegistered, merchantName] = await campusCredit.getMerchantInfo(deployer.address);
    console.log("🏪 Merchant Status:", isRegistered ? "Registered" : "Not Registered");
    console.log("🏪 Merchant Name:", merchantName);

    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ All contracts deployed");
    console.log("✅ Merchant registered (your address)");
    console.log("✅ Daily spending limit set");
    console.log("✅ Ready for testing!");
    
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    console.log("\n💡 You can setup manually through explorer interface");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });