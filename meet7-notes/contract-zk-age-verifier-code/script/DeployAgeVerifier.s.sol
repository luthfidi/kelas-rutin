// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "lib/forge-std/src/Script.sol";
import {AgeVerifier} from "../src/AgeVerifier.sol";
import {Groth16Verifier} from "../src/verifier.sol";

contract DeployAgeVerifier is Script {
    AgeVerifier public ageVerifier;
    Groth16Verifier public groth16Verifier;

    function setUp() public {}

    function run() public returns (AgeVerifier, Groth16Verifier, address, address) {
        console.log("Starting Age Verification System deployment to Monad Testnet...\n");

        // Get deployer account from private key
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployment Details:");
        console.log("Deployer address:", deployer);
        
        // Check balance
        uint256 balance = deployer.balance;
        console.log("Deployer balance:", balance / 1e18, "MON");
        
        if (balance < 0.05 ether) {
            console.log("Warning: Low balance. Make sure you have enough MON for deployment.");
            console.log("Recommended minimum: 0.05 MON for deploying 2 contracts");
        }

        // Get network info
        console.log("Network: Monad Testnet");
        console.log("Chain ID: 10143");
        console.log("RPC URL: https://testnet-rpc.monad.xyz/\n");

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        console.log("Step 1: Deploying Groth16Verifier contract...");
        
        // Deploy Groth16Verifier first
        groth16Verifier = new Groth16Verifier();
        address verifierAddress = address(groth16Verifier);
        
        console.log("Groth16Verifier deployed at:", verifierAddress);

        console.log("Step 2: Deploying AgeVerifier contract...");
        
        // Deploy AgeVerifier with verifier address
        ageVerifier = new AgeVerifier(verifierAddress);
        address ageVerifierAddress = address(ageVerifier);

        vm.stopBroadcast();

        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("Groth16Verifier address:", verifierAddress);
        console.log("AgeVerifier address:", ageVerifierAddress);
        console.log("Groth16Verifier explorer:");
        console.log(string.concat("https://testnet.monadexplorer.com/address/", _addressToString(verifierAddress)));
        console.log("AgeVerifier explorer:");
        console.log(string.concat("https://testnet.monadexplorer.com/address/", _addressToString(ageVerifierAddress)));

        // Verify initial state
        console.log("\nVerifying initial contract state...");
        address linkedVerifier = address(ageVerifier.verifier());
        
        console.log("AgeVerifier linked verifier:", linkedVerifier);
        console.log("Verifier linkage correct:", linkedVerifier == verifierAddress ? "YES" : "NO");
        
        // Test some view functions
        console.log("Initial verification states:");
        console.log("- Deployer is verified adult:", ageVerifier.isVerifiedAdult(deployer) ? "YES" : "NO");
        console.log("- Deployer verification time:", ageVerifier.getVerificationTime(deployer));
        
        // Test commitment status with dummy value
        uint256 dummyCommitment = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        console.log("- Dummy commitment used:", ageVerifier.isCommitmentUsed(dummyCommitment) ? "YES" : "NO");

        // Gas cost estimation
        console.log("\nEstimated gas costs:");
        console.log("- Groth16Verifier deployment: ~1,500,000 gas");
        console.log("- AgeVerifier deployment: ~800,000 gas");
        console.log("- Age verification call: ~150,000-200,000 gas");

        // Provide next steps
        console.log("\n=== NEXT STEPS ===");
        console.log("1. Save contract addresses for future interactions");
        console.log("2. Verify contracts on block explorer (optional)");
        console.log("3. Generate ZK proofs using your circom circuit");
        console.log("4. Test age verification with valid proofs");
        console.log("5. Integrate with your frontend application");
        console.log("6. Set up monitoring for verification events");

        // Frontend integration info
        console.log("\n=== FRONTEND INTEGRATION ===");
        console.log("Add these to your environment variables:");
        console.log("REACT_APP_AGE_VERIFIER_ADDRESS=", ageVerifierAddress);
        console.log("REACT_APP_GROTH16_VERIFIER_ADDRESS=", verifierAddress);
        console.log("REACT_APP_MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz/");
        console.log("REACT_APP_CHAIN_ID=10143");

        // Cast command examples
        console.log("\n=== CAST COMMANDS FOR TESTING ===");
        console.log("Check if address is verified:");
        console.log("cast call", ageVerifierAddress, "\"isVerifiedAdult(address)(bool)\" <ADDRESS> --rpc-url https://testnet-rpc.monad.xyz/");
        console.log("\nCheck commitment status:");
        console.log("cast call", ageVerifierAddress, "\"isCommitmentUsed(uint256)(bool)\" <COMMITMENT> --rpc-url https://testnet-rpc.monad.xyz/");

        // Save deployment info (with proper error handling)
        _saveDeploymentInfo(ageVerifierAddress, verifierAddress, deployer);

        console.log("\n=== DEPLOYMENT COMPLETED SUCCESSFULLY ===");

        return (ageVerifier, groth16Verifier, ageVerifierAddress, verifierAddress);
    }

    function _saveDeploymentInfo(address ageVerifierAddress, address verifierAddress, address deployer) internal {
        string memory deploymentInfo = string.concat(
            "{\n",
            '  "network": "Monad Testnet",\n',
            '  "chainId": "10143",\n',
            '  "rpcUrl": "https://testnet-rpc.monad.xyz/",\n',
            '  "blockExplorer": "https://testnet.monadexplorer.com",\n',
            '  "deployerAddress": "', _addressToString(deployer), '",\n',
            '  "contracts": {\n',
            '    "AgeVerifier": {\n',
            '      "address": "', _addressToString(ageVerifierAddress), '",\n',
            '      "explorer": "https://testnet.monadexplorer.com/address/', _addressToString(ageVerifierAddress), '"\n',
            '    },\n',
            '    "Groth16Verifier": {\n',
            '      "address": "', _addressToString(verifierAddress), '",\n',
            '      "explorer": "https://testnet.monadexplorer.com/address/', _addressToString(verifierAddress), '"\n',
            '    }\n',
            '  },\n',
            '  "deploymentTimestamp": "', _getTimestamp(), '",\n',
            '  "estimatedGasCosts": {\n',
            '    "groth16VerifierDeployment": "1500000",\n',
            '    "ageVerifierDeployment": "800000",\n',
            '    "ageVerificationCall": "150000-200000"\n',
            '  },\n',
            '  "frontendEnvVars": {\n',
            '    "REACT_APP_AGE_VERIFIER_ADDRESS": "', _addressToString(ageVerifierAddress), '",\n',
            '    "REACT_APP_GROTH16_VERIFIER_ADDRESS": "', _addressToString(verifierAddress), '",\n',
            '    "REACT_APP_MONAD_TESTNET_RPC": "https://testnet-rpc.monad.xyz/",\n',
            '    "REACT_APP_CHAIN_ID": "10143"\n',
            '  }\n',
            "}"
        );

        // Try to write deployment info to file (with error handling)
        try vm.writeFile("deployments/age-verifier-monad-testnet.json", deploymentInfo) {
            console.log("\nDeployment info saved to: deployments/age-verifier-monad-testnet.json");
        } catch {
            console.log("\nNote: Could not save deployment file (permission issue)");
            console.log("You can manually save this deployment info:");
            console.log("=== DEPLOYMENT JSON ===");
            console.log(deploymentInfo);
            console.log("=== END JSON ===");
        }
    }

    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    function _getTimestamp() internal view returns (string memory) {
        // Return block number as timestamp since we can't get actual timestamp in scripts
        return vm.toString(block.number);
    }

    // Helper function for batch verification testing (view only)
    function batchVerificationHelper(address[] memory testAddresses) external view returns (bool[] memory) {
        require(address(ageVerifier) != address(0), "AgeVerifier not deployed");
        return ageVerifier.batchCheckVerification(testAddresses);
    }

    // Helper function to estimate gas for age verification (not a test)
    function estimateVerificationGasHelper(
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[2] memory _publicSignals
    ) external returns (uint256) {
        require(address(ageVerifier) != address(0), "AgeVerifier not deployed");
        
        uint256 gasBefore = gasleft();
        
        try ageVerifier.verifyAge(_pA, _pB, _pC, _publicSignals) {
            // If successful
            return gasBefore - gasleft();
        } catch {
            // If failed, still return gas used
            return gasBefore - gasleft();
        }
    }
}