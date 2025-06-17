import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying StudentID to Monad Testnet");
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

  // Deploy StudentID
  console.log("📦 Deploying StudentID...");
  
  const StudentID = await ethers.getContractFactory("StudentID");
  const studentID = await StudentID.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await studentID.waitForDeployment();
  
  const address = await studentID.getAddress();
  console.log("✅ StudentID deployed to:", address);
  
  // Wait for block confirmations
  console.log("⏳ Waiting 60 seconds for block confirmations...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Basic contract interaction test
  console.log("\n🧪 Testing contract functions...");
  try {
    const name = await studentID.name();
    const symbol = await studentID.symbol();
    const owner = await studentID.owner();
    
    console.log("📊 Contract Details:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Deployer: ${deployer.address}`);
    
    // Test issuing a student ID
    console.log("\n🧪 Testing student ID issuance...");
    const tx = await studentID.issueStudentID(
      deployer.address,
      "2024001",
      "Test Student",
      "Computer Science",
      "https://example.com/metadata/1"
    );
    await tx.wait();
    
    const tokenId = await studentID.addressToTokenId(deployer.address);
    console.log(`✅ Test Student ID issued with Token ID: ${tokenId}`);
    
    // Test getting student info
    const studentInfo = await studentID.getStudentInfo(tokenId);
    console.log(`✅ Student Name: ${studentInfo.data.name}`);
    console.log(`✅ Student NIM: ${studentInfo.data.nim}`);
    console.log(`✅ Student Major: ${studentInfo.data.major}`);
    
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
      name: "StudentID",
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
  fs.writeFileSync('student-id-deployment.json', JSON.stringify(deploymentData, null, 2));
  
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=" .repeat(50));
  console.log("🆔 StudentID Address:", address);
  console.log("🔗 Explorer Link:", `https://testnet-explorer.monad.xyz/address/${address}`);
  console.log("💾 Deployment data saved to: student-id-deployment.json");
  
  console.log("\n🎉 StudentID deployment completed!");
  console.log("\n📝 Next steps:");
  console.log("1. Verify the contract on explorer (if auto-verification failed)");
  console.log("2. Test issuing student IDs");
  console.log("3. Deploy CourseBadge contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });