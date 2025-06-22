import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying CourseBadge to Monad Testnet");
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

  // Deploy CourseBadge
  console.log("📦 Deploying CourseBadge...");
  
  const CourseBadge = await ethers.getContractFactory("CourseBadge");
  const courseBadge = await CourseBadge.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await courseBadge.waitForDeployment();
  
  const address = await courseBadge.getAddress();
  console.log("✅ CourseBadge deployed to:", address);
  
  // Wait for block confirmations
  console.log("⏳ Waiting 60 seconds for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Basic contract interaction test
  console.log("\n🧪 Testing contract functions...");
  try {
    // Test basic ERC1155 interface
    const supportsERC1155 = await courseBadge.supportsInterface("0xd9b67a26");
    console.log(`   Supports ERC1155: ${supportsERC1155}`);
    
    // Test role checking (use string method instead of function)
    try {
      const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000"; // DEFAULT_ADMIN_ROLE
      const minterRoleHash = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      
      const hasAdminRole = await courseBadge.hasRole(defaultAdminRole, deployer.address);
      const hasMinterRole = await courseBadge.hasRole(minterRoleHash, deployer.address);
      
      console.log(`   Deployer has Admin Role: ${hasAdminRole}`);
      console.log(`   Deployer has Minter Role: ${hasMinterRole}`);
    } catch (roleError) {
      console.log("   ⚠️ Role check skipped:", roleError);
    }
    
    // Test creating a certificate type
    console.log("\n🧪 Testing certificate creation...");
    const tx = await courseBadge.createCertificateType(
      "Web3 Development Certificate",
      100, // max supply
      "https://example.com/certificate/web3-dev"
    );
    const receipt = await tx.wait();
    console.log(`   ✅ Certificate type created successfully!`);
    console.log(`   Transaction hash: ${receipt?.hash}`);
    
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
      name: "CourseBadge",
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
  fs.writeFileSync('course-badge-deployment.json', JSON.stringify(deploymentData, null, 2));
  
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(50));
  console.log("🏆 CourseBadge Address:", address);
  console.log("🔗 Explorer Link:", `https://testnet-explorer.monad.xyz/address/${address}`);
  console.log("💾 Deployment data saved to: course-badge-deployment.json");
  
  console.log("\n🎉 CourseBadge deployment completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Verify the contract on explorer (if auto-verification failed)");
  console.log("2. Test creating badge types and issuing certificates");
  console.log("3. Integration testing with all three contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });