const hre = require("hardhat");

async function verifyContract(name, address, constructorArgs = []) {
  console.log(`\n🔍 Verifying ${name} on Monad...`);
  console.log(`📍 Address: ${address}`);
  console.log(`🔧 Constructor Args: ${constructorArgs.length === 0 ? 'none' : constructorArgs}`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs
    });
    console.log(`✅ ${name} verified successfully!`);
    console.log(`🔗 View: https://testnet.monadexplorer.com/address/${address}`);
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified") || error.message.includes("already verified")) {
      console.log(`✅ ${name} already verified!`);
      console.log(`🔗 View: https://testnet.monadexplorer.com/address/${address}`);
      return true;
    } else {
      console.log(`❌ ${name} verification failed:`);
      console.log(`   Error: ${error.message}`);
      return false;
    }
  }
}

async function main() {
  console.log("🚀 Monad Contract Verification via Sourcify");
  console.log("=" .repeat(50));
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`⛓️ Chain ID: ${hre.network.config.chainId}`);
  console.log(`🔗 Sourcify API: https://sourcify-api-monad.blockvision.org`);
  console.log("");

  // Contract addresses dari deployment
  const contracts = [
    {
      name: "CampusCredit",
      address: "0xf35ACB514F55D965233aEC6208C8F3991ac6C016",
      constructorArgs: [] // No constructor arguments
    },
    {
      name: "StudentID", 
      address: "0x5cc7e6551F82B3Db3C6c2CB1319e9aA52a2638Ca",
      constructorArgs: [] // No constructor arguments
    },
    {
      name: "CourseBadge",
      address: "0x0C3cE9AAcA31cD889D95A3940C2bA6C06a8244Ac", 
      constructorArgs: [] // No constructor arguments
    }
  ];

  const results = [];

  for (const contract of contracts) {
    const success = await verifyContract(
      contract.name, 
      contract.address, 
      contract.constructorArgs
    );
    results.push({ ...contract, verified: success });
    
    // Wait 3 seconds between attempts
    if (contracts.indexOf(contract) < contracts.length - 1) {
      console.log("⏳ Waiting 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log("\n📊 VERIFICATION SUMMARY");
  console.log("=" .repeat(50));
  
  const verified = results.filter(r => r.verified);
  const failed = results.filter(r => !r.verified);
  
  console.log(`✅ Successfully verified: ${verified.length}/3`);
  console.log(`❌ Failed: ${failed.length}/3`);
  
  console.log("\n📋 Detailed Results:");
  results.forEach(result => {
    const status = result.verified ? "✅ VERIFIED" : "❌ FAILED";
    console.log(`  ${result.name}: ${status}`);
  });
  
  console.log("\n🔗 Explorer Links:");
  results.forEach(result => {
    console.log(`  ${result.name}: https://testnet.monadexplorer.com/address/${result.address}`);
  });

  if (verified.length === 3) {
    console.log("\n🎉 All contracts verified successfully!");
    console.log("✅ Campus Digital Token Suite is fully verified and ready!");
  } else if (verified.length > 0) {
    console.log(`\n⚠️ ${verified.length}/3 contracts verified.`);
    console.log("💡 Check failed contracts manually on explorer.");
  } else {
    console.log("\n❌ No contracts verified automatically.");
    console.log("💡 Try manual verification on Monad explorer.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    console.log("\n💡 Fallback options:");
    console.log("1. Try manual verification on Monad explorer");
    console.log("2. Check network connectivity");
    console.log("3. Verify Sourcify service is available");
    process.exit(1);
  });