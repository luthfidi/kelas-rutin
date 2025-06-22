const hre = require("hardhat");

async function verifyContract(name, address, constructorArgs = []) {
  console.log(`\n🔍 Verifying ${name}...`);
  console.log(`📍 Address: ${address}`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${name} verified successfully!`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified") || 
        error.message.includes("already verified") ||
        error.message.includes("Contract source code already verified")) {
      console.log(`✅ ${name} already verified!`);
      return true;
    } else {
      console.log(`❌ ${name} verification failed:`);
      console.log(`   Error: ${error.message}`);
      
      // Try alternative verification approach
      console.log(`🔄 Trying alternative verification for ${name}...`);
      try {
        await hre.run("verify", {
          address: address,
          constructorArgs: constructorArgs,
        });
        console.log(`✅ ${name} verified with alternative method!`);
        return true;
      } catch (altError) {
        console.log(`❌ Alternative verification also failed: ${altError.message}`);
        return false;
      }
    }
  }
}

async function main() {
  console.log("🚀 Starting Contract Verification");
  console.log("=" .repeat(50));
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`⛓️ Chain ID: ${hre.network.config.chainId}`);
  console.log("");

  // Contract addresses
  const contracts = [
    {
      name: "CampusCredit",
      address: "0xf35ACB514F55D965233aEC6208C8F3991ac6C016",
      constructorArgs: []
    },
    {
      name: "StudentID", 
      address: "0x5cc7e6551F82B3Db3C6c2CB1319e9aA52a2638Ca",
      constructorArgs: []
    },
    {
      name: "CourseBadge",
      address: "0x0C3cE9AAcA31cD889D95A3940C2bA6C06a8244Ac", 
      constructorArgs: []
    }
  ];

  // First, let's compile contracts to ensure they're up to date
  console.log("🔨 Compiling contracts...");
  try {
    await hre.run("compile");
    console.log("✅ Compilation successful!");
  } catch (error) {
    console.log("⚠️ Compilation warning:", error.message);
  }

  const results = [];

  // Verify each contract with delay
  for (const contract of contracts) {
    const success = await verifyContract(
      contract.name, 
      contract.address, 
      contract.constructorArgs
    );
    results.push({ ...contract, verified: success });
    
    // Wait 5 seconds between attempts to avoid rate limiting
    if (contracts.indexOf(contract) < contracts.length - 1) {
      console.log("⏳ Waiting 5 seconds before next verification...");
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log("\n📊 VERIFICATION SUMMARY");
  console.log("=" .repeat(50));
  
  const verified = results.filter(r => r.verified);
  const failed = results.filter(r => !r.verified);
  
  console.log(`✅ Successfully verified: ${verified.length}/${contracts.length}`);
  console.log(`❌ Failed: ${failed.length}/${contracts.length}`);
  
  console.log("\n📋 Detailed Results:");
  results.forEach(result => {
    const status = result.verified ? "✅ VERIFIED" : "❌ FAILED";
    console.log(`  ${result.name}: ${status}`);
  });
  
  // Explorer links
  let explorerBase;
  if (hre.network.name === "monadTestnet" || hre.network.name === "monad") {
    explorerBase = "https://testnet-explorer.monad.xyz/address";
  } else if (hre.network.name === "sepolia") {
    explorerBase = "https://sepolia.etherscan.io/address";
  } else if (hre.network.name === "mainnet") {
    explorerBase = "https://etherscan.io/address";
  }

  if (explorerBase) {
    console.log("\n🔗 Explorer Links:");
    results.forEach(result => {
      console.log(`  ${result.name}: ${explorerBase}/${result.address}`);
    });
  }

  if (verified.length === contracts.length) {
    console.log("\n🎉 All contracts verified successfully!");
  } else if (verified.length > 0) {
    console.log(`\n⚠️ ${verified.length}/${contracts.length} contracts verified.`);
    console.log("💡 Manual verification may be needed for failed contracts.");
  } else {
    console.log("\n❌ No contracts verified automatically.");
    console.log("💡 Check network configuration and try manual verification.");
  }

  // Manual verification instructions for failed contracts
  if (failed.length > 0) {
    console.log("\n📝 Manual Verification Instructions:");
    console.log("For failed contracts, try these steps:");
    console.log("1. Visit the explorer link for each contract");
    console.log("2. Go to 'Contract' tab");
    console.log("3. Click 'Verify and Publish'");
    console.log("4. Select 'Solidity (Single file)' or 'Solidity (Standard JSON)'");
    console.log("5. Upload the flattened contract source code");
    
    failed.forEach(contract => {
      console.log(`\n${contract.name} manual verification:`);
      console.log(`- Address: ${contract.address}`);
      console.log(`- Compiler Version: 0.8.28`);
      console.log(`- Optimization: Enabled (200 runs)`);
      console.log(`- Constructor Args: None`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    console.log("\n💡 Troubleshooting tips:");
    console.log("1. Check network connectivity");
    console.log("2. Ensure contracts are deployed and confirmed");
    console.log("3. Verify Hardhat configuration is correct");
    console.log("4. Try manual verification on block explorer");
    process.exit(1);
  });