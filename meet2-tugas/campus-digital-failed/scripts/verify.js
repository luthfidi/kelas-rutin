const hre = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Read deployed addresses
  let addresses;
  try {
    const addressFile = fs.readFileSync('deployed-addresses.json', 'utf8');
    addresses = JSON.parse(addressFile);
    console.log("📁 Loaded addresses from deployed-addresses.json");
  } catch (error) {
    console.log("❌ deployed-addresses.json not found. Please deploy contracts first.");
    console.log("Run: npm run deploy:monad or npm run deploy:sepolia");
    return;
  }

  const network = hre.network.name;
  console.log("🌐 Network:", network);
  console.log("📋 Contracts to verify:");
  console.log("-".repeat(50));
  
  const contracts = addresses.contracts;

  // Verify CampusCredit
  if (contracts.CampusCredit) {
    console.log("🏦 Verifying CampusCredit...");
    try {
      await hre.run("verify:verify", {
        address: contracts.CampusCredit,
        constructorArguments: [], // No constructor args
      });
      console.log("✅ CampusCredit verified successfully!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ CampusCredit already verified!");
      } else {
        console.log("❌ CampusCredit verification failed:", error.message);
      }
    }
  }

  // Verify StudentID
  if (contracts.StudentID) {
    console.log("\n🆔 Verifying StudentID...");
    try {
      await hre.run("verify:verify", {
        address: contracts.StudentID,
        constructorArguments: [], // No constructor args
      });
      console.log("✅ StudentID verified successfully!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ StudentID already verified!");
      } else {
        console.log("❌ StudentID verification failed:", error.message);
      }
    }
  }

  // Verify CourseBadge
  if (contracts.CourseBadge) {
    console.log("\n🏆 Verifying CourseBadge...");
    try {
      await hre.run("verify:verify", {
        address: contracts.CourseBadge,
        constructorArguments: [], // No constructor args
      });
      console.log("✅ CourseBadge verified successfully!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ CourseBadge already verified!");
      } else {
        console.log("❌ CourseBadge verification failed:", error.message);
      }
    }
  }

  console.log("\n🎉 Verification process completed!");
  console.log("\n📋 VERIFICATION SUMMARY");
  console.log("=".repeat(50));
  console.log("🏦 CampusCredit:", contracts.CampusCredit);
  console.log("🆔 StudentID:", contracts.StudentID);  
  console.log("🏆 CourseBadge:", contracts.CourseBadge);
  console.log("=".repeat(50));

  // Display explorer links
  let explorerBase;
  if (network === "monad") {
    explorerBase = "https://testnet-explorer.monad.xyz/address";
  } else if (network === "sepolia") {
    explorerBase = "https://sepolia.etherscan.io/address";
  } else {
    explorerBase = "https://etherscan.io/address";
  }

  console.log("\n🔗 Explorer Links:");
  console.log("-".repeat(50));
  console.log(`🏦 CampusCredit: ${explorerBase}/${contracts.CampusCredit}`);
  console.log(`🆔 StudentID: ${explorerBase}/${contracts.StudentID}`);
  console.log(`🏆 CourseBadge: ${explorerBase}/${contracts.CourseBadge}`);
  console.log("-".repeat(50));

  console.log("\n💡 Next Steps:");
  console.log("1. Visit explorer links to confirm verification");
  console.log("2. Test contract functions through explorer interface");
  console.log("3. Submit contract addresses for challenge completion");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });