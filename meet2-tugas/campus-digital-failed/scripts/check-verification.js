const hre = require("hardhat");

async function checkContractVerification(address, name) {
  console.log(`\n🔍 Checking ${name} verification status...`);
  console.log(`📍 Address: ${address}`);
  
  try {
    // Try to get contract source code
    const code = await hre.ethers.provider.getCode(address);
    
    if (code === "0x") {
      console.log(`❌ ${name}: No contract found at this address`);
      return false;
    }
    
    console.log(`✅ ${name}: Contract deployed (bytecode length: ${code.length} chars)`);
    
    // Check if we can interact with the contract
    try {
      // Try to get contract name (this works for most ERC contracts)
      if (name === "CampusCredit" || name === "StudentID") {
        const contract = await hre.ethers.getContractAt(name, address);
        const contractName = await contract.name();
        console.log(`✅ ${name}: Contract name: "${contractName}"`);
      } else if (name === "CourseBadge") {
        const contract = await hre.ethers.getContractAt(name, address);
        // CourseBadge doesn't have name() function, try supportsInterface
        const supports1155 = await contract.supportsInterface("0xd9b67a26"); // ERC1155
        console.log(`✅ ${name}: Supports ERC1155: ${supports1155}`);
      }
    } catch (error) {
      console.log(`⚠️ ${name}: Contract exists but interface check failed`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ ${name}: Error checking contract:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🔍 Checking Contract Verification Status");
  console.log("=" .repeat(50));
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`⛓️ Chain ID: ${hre.network.config.chainId}`);
  console.log("");

  const contracts = [
    {
      name: "CampusCredit",
      address: "0xf35ACB514F55D965233aEC6208C8F3991ac6C016"
    },
    {
      name: "StudentID", 
      address: "0x5cc7e6551F82B3Db3C6c2CB1319e9aA52a2638Ca"
    },
    {
      name: "CourseBadge",
      address: "0x0C3cE9AAcA31cD889D95A3940C2bA6C06a8244Ac"
    }
  ];

  const results = [];

  for (const contract of contracts) {
    const status = await checkContractVerification(contract.address, contract.name);
    results.push({ ...contract, deployed: status });
  }

  console.log("\n📊 CONTRACT STATUS SUMMARY");
  console.log("=" .repeat(50));
  
  const deployed = results.filter(r => r.deployed);
  console.log(`✅ Deployed contracts: ${deployed.length}/${contracts.length}`);
  
  console.log("\n📋 Individual Status:");
  results.forEach(result => {
    const status = result.deployed ? "✅ DEPLOYED" : "❌ NOT FOUND";
    console.log(`  ${result.name}: ${status}`);
  });

  console.log("\n🔗 Explorer Links:");
  const explorerBase = "https://testnet-explorer.monad.xyz/address";
  results.forEach(result => {
    console.log(`  ${result.name}: ${explorerBase}/${result.address}`);
  });

  console.log("\n📝 Next Steps for Verification:");
  console.log("1. Run: npm run flatten:all");
  console.log("2. Run: npm run verify:monad");
  console.log("3. If automatic fails, use manual verification:");
  console.log("   - Visit explorer links above");
  console.log("   - Use flattened files from ./flattened/ directory");
  console.log("   - Compiler: 0.8.28, Optimization: Yes (200 runs)");

  if (deployed.length === contracts.length) {
    console.log("\n🎉 All contracts are deployed and ready for verification!");
  } else {
    console.log("\n⚠️ Some contracts may need redeployment.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Check failed:", error);
    process.exit(1);
  });