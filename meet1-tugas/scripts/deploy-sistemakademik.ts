import { ethers } from "hardhat";
import { SistemAkademik } from "../typechain-types";

async function main() {
  console.log("🚀 Starting SistemAkademik deployment to Monad Testnet...\n");

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

  // Deploy SistemAkademik
  console.log("📦 Deploying SistemAkademik contract...");
  const SistemAkademikFactory = await ethers.getContractFactory("SistemAkademik");
  
  // Estimate gas
  const deployTx = await SistemAkademikFactory.getDeployTransaction();
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  console.log("├── Estimated gas:", estimatedGas.toString());

  // Deploy with manual gas limit (adding 20% buffer)
  const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
  const sistemAkademik: SistemAkademik = await SistemAkademikFactory.deploy({
    gasLimit: gasLimit
  });

  console.log("├── Transaction hash:", sistemAkademik.deploymentTransaction()?.hash);
  console.log("├── Waiting for deployment confirmation...");

  // Wait for deployment
  await sistemAkademik.waitForDeployment();
  const contractAddress = await sistemAkademik.getAddress();

  console.log("✅ SistemAkademik deployed successfully!");
  console.log("├── Contract address:", contractAddress);
  console.log("├── Block explorer:", `https://testnet.monadexplorer.com/address/${contractAddress}`);

  // Verify initial state
  console.log("\n🔍 Verifying initial contract state...");
  try {
    const isAuthorized = await sistemAkademik.authorized(deployer.address);
    const totalStudents = await sistemAkademik.getTotalStudents();
    const allNIM = await sistemAkademik.getAllNIM();

    console.log("├── Deployer authorized:", isAuthorized);
    console.log("├── Total students:", totalStudents.toString());
    console.log("└── All NIMs:", allNIM.length > 0 ? allNIM.map(n => n.toString()) : "[]");

    // Test enrollment (optional demo)
    console.log("\n🎓 Testing enrollment function...");
    const enrollTx = await sistemAkademik.enrollMahasiswa(
      12345678,
      "Test Student",
      "Teknik Informatika"
    );
    await enrollTx.wait();
    console.log("✅ Test student enrolled successfully");

    const updatedTotal = await sistemAkademik.getTotalStudents();
    console.log("└── Total students after test:", updatedTotal.toString());

  } catch (error) {
    console.log("❌ Error verifying contract state:", error);
  }

  // Get deployment cost
  const deploymentTx = sistemAkademik.deploymentTransaction();
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
  console.log("   - enrollMahasiswa() - Register new student");
  console.log("   - addGrade() - Add student grade");
  console.log("   - getStudentInfo() - Get student data");
  console.log("   - calculateGPA() - Calculate student GPA");
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
    path.join(deploymentsDir, 'sistemakademik-monad-testnet.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployments/sistemakademik-monad-testnet.json");
  
  return {
    sistemAkademik,
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