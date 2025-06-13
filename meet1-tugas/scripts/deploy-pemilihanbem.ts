import { ethers } from "hardhat";
import { PemilihanBEM } from "../typechain-types";

async function main() {
  console.log("🚀 Starting PemilihanBEM deployment to Monad Testnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deployment Details:");
  console.log("├── Deployer address:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("├── Deployer balance:", ethers.formatEther(balance), "MON");

  if (balance < ethers.parseEther("0.01")) {
    console.log(
      "⚠️  Warning: Low balance. Make sure you have enough MON for deployment."
    );
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("├── Network:", network.name);
  console.log("├── Chain ID:", network.chainId.toString());
  console.log("└── RPC URL:", "https://testnet-rpc.monad.xyz/\n");

  // Deploy PemilihanBEM
  console.log("📦 Deploying PemilihanBEM contract...");

  // Set voting duration (5 minutes = 300 seconds for demo)
  const votingDuration = 300;
  console.log("├── Voting duration:", votingDuration, "seconds (5 minutes)");

  const PemilihanBEMFactory = await ethers.getContractFactory("PemilihanBEM");

  // Estimate gas
  const deployTx = await PemilihanBEMFactory.getDeployTransaction(
    votingDuration
  );
  const estimatedGas = await ethers.provider.estimateGas(deployTx);
  console.log("├── Estimated gas:", estimatedGas.toString());

  // Deploy with manual gas limit (adding 20% buffer)
  const gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
  const pemilihanBEM: PemilihanBEM = await PemilihanBEMFactory.deploy(
    votingDuration,
    {
      gasLimit: gasLimit,
    }
  );

  console.log(
    "├── Transaction hash:",
    pemilihanBEM.deploymentTransaction()?.hash
  );
  console.log("├── Waiting for deployment confirmation...");

  // Wait for deployment
  await pemilihanBEM.waitForDeployment();
  const contractAddress = await pemilihanBEM.getAddress();

  console.log("✅ PemilihanBEM deployed successfully!");
  console.log("├── Contract address:", contractAddress);
  console.log(
    "├── Block explorer:",
    `https://testnet.monadexplorer.com/address/${contractAddress}`
  );

  // Verify initial state
  console.log("\n🔍 Verifying initial contract state...");
  try {
    const admin = await pemilihanBEM.admin();
    const waktuMulai = await pemilihanBEM.waktuMulai();
    const waktuSelesai = await pemilihanBEM.waktuSelesai();
    const totalKandidat = await pemilihanBEM.getTotalKandidat();
    const isRegistered = await pemilihanBEM.pemilihTerdaftar(deployer.address);

    const currentTime = Math.floor(Date.now() / 1000);
    const startTime = Number(waktuMulai);
    const endTime = Number(waktuSelesai);

    console.log("├── Admin:", admin);
    console.log(
      "├── Voting start time:",
      new Date(startTime * 1000).toLocaleString()
    );
    console.log(
      "├── Voting end time:",
      new Date(endTime * 1000).toLocaleString()
    );
    console.log("├── Total candidates:", totalKandidat.toString());
    console.log("├── Admin registered as voter:", isRegistered);
    console.log(
      "└── Voting active:",
      currentTime >= startTime && currentTime <= endTime
    );

    // Add sample candidates for demo
    console.log("\n🎯 Adding sample candidates...");
    const addCandidate1 = await pemilihanBEM.addKandidat(
      "Budi Santoso",
      "Membangun BEM yang inovatif dan digital"
    );
    await addCandidate1.wait();

    const addCandidate2 = await pemilihanBEM.addKandidat(
      "Sari Dewi",
      "BEM untuk semua, transparansi dan akuntabilitas"
    );
    await addCandidate2.wait();

    console.log("✅ Sample candidates added");
    const updatedTotal = await pemilihanBEM.getTotalKandidat();
    console.log("└── Total candidates now:", updatedTotal.toString());
  } catch (error) {
    console.log("❌ Error verifying contract state:", error);
  }

  // Get deployment cost
  const deploymentTx = pemilihanBEM.deploymentTransaction();
  if (deploymentTx) {
    const receipt = await deploymentTx.wait();
    if (receipt) {
      const cost = receipt.gasUsed * receipt.gasPrice;
      console.log("\n💰 Deployment Cost:");
      console.log("├── Gas used:", receipt.gasUsed.toString());
      console.log(
        "├── Gas price:",
        ethers.formatUnits(receipt.gasPrice, "gwei"),
        "gwei"
      );
      console.log("└── Total cost:", ethers.formatEther(cost), "MON");
    }
  }

  // Provide next steps
  console.log("\n📋 Next Steps:");
  console.log("1. Save the contract address for future interactions");
  console.log("2. Verify the contract on block explorer using:");
  console.log(
    `   npx hardhat verify --network monadTestnet ${contractAddress} ${votingDuration}`
  );
  console.log("3. Test contract functions:");
  console.log("   - addKandidat() - Add voting candidates");
  console.log("   - registerVoter() - Register voters");
  console.log("   - vote() - Cast your vote");
  console.log("   - getResults() - View voting results");
  console.log("   - getWinner() - Get winner after voting ends");
  console.log("4. Add the contract to your MetaMask for easy interaction");

  // Save deployment info to file
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    votingDuration: votingDuration,
    network: network.name,
    chainId: network.chainId.toString(),
    blockExplorer: `https://testnet.monadexplorer.com/address/${contractAddress}`,
    timestamp: new Date().toISOString(),
    txHash: deploymentTx?.hash,
  };

  // Write to file (optional)
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  fs.writeFileSync(
    path.join(deploymentsDir, "pemilihanbem-monad-testnet.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(
    "\n💾 Deployment info saved to: deployments/pemilihanbem-monad-testnet.json"
  );

  return {
    pemilihanBEM,
    contractAddress,
    deploymentInfo,
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
