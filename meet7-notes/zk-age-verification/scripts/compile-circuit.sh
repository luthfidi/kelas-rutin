#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

CIRCUIT_NAME=${1:-ageVerification}

print_status "Starting circuit compilation for: $CIRCUIT_NAME"

if ! command -v circom &> /dev/null; then
    print_error "circom is not installed"
    exit 1
fi

if ! command -v snarkjs &> /dev/null; then
    print_error "snarkjs is not installed"
    exit 1
fi

# Create build directory with proper permissions
print_status "Creating circuits build directory..."
rm -rf circuits/build
mkdir -p circuits/build
chmod 755 circuits/build

if [ ! -f "circuits/${CIRCUIT_NAME}.circom" ]; then
    print_error "Circuit file circuits/${CIRCUIT_NAME}.circom not found!"
    exit 1
fi

print_status "Circuit file found: circuits/${CIRCUIT_NAME}.circom"

# Compile circuit with explicit output directory
print_status "Compiling circuit..."
cd circuits/build
if circom ../${CIRCUIT_NAME}.circom --r1cs --wasm --sym; then
    cd ../..
    print_success "Circuit compiled successfully!"
else
    cd ../..
    print_error "Circuit compilation failed!"
    exit 1
fi

# Verify files exist
if [ ! -f "circuits/build/${CIRCUIT_NAME}.r1cs" ]; then
    print_error "R1CS file not generated!"
    exit 1
fi

if [ ! -d "circuits/build/${CIRCUIT_NAME}_js" ]; then
    print_error "WASM files not generated!"
    exit 1
fi

print_status "Generated files:"
echo "  - circuits/build/${CIRCUIT_NAME}.r1cs"
echo "  - circuits/build/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
echo "  - circuits/build/${CIRCUIT_NAME}.sym"

# Continue with rest of the setup...
print_status "Generating powers of tau..."
if [ ! -f "circuits/build/pot14_0000.ptau" ]; then
    if snarkjs powersoftau new bn128 14 circuits/build/pot14_0000.ptau -v; then
        print_success "Powers of tau generated!"
    else
        print_error "Failed to generate powers of tau!"
        exit 1
    fi
fi

print_status "Contributing to ceremony..."
if [ ! -f "circuits/build/pot14_0001.ptau" ]; then
    echo "random-entropy-$(date +%s)" | snarkjs powersoftau contribute circuits/build/pot14_0000.ptau circuits/build/pot14_0001.ptau --name="First contribution" -v
fi

print_status "Phase 2 setup..."
if [ ! -f "circuits/build/pot14_final.ptau" ]; then
    snarkjs powersoftau prepare phase2 circuits/build/pot14_0001.ptau circuits/build/pot14_final.ptau -v
fi

print_status "Generating proving key..."
if [ ! -f "circuits/build/${CIRCUIT_NAME}_0000.zkey" ]; then
    snarkjs groth16 setup circuits/build/${CIRCUIT_NAME}.r1cs circuits/build/pot14_final.ptau circuits/build/${CIRCUIT_NAME}_0000.zkey
fi

print_status "Contributing to phase 2..."
if [ ! -f "circuits/build/${CIRCUIT_NAME}_0001.zkey" ]; then
    echo "random-entropy-phase2-$(date +%s)" | snarkjs zkey contribute circuits/build/${CIRCUIT_NAME}_0000.zkey circuits/build/${CIRCUIT_NAME}_0001.zkey --name="First phase2 contribution" -v
fi

print_status "Exporting verification key..."
snarkjs zkey export verificationkey circuits/build/${CIRCUIT_NAME}_0001.zkey circuits/build/verification_key.json

print_status "Generating Solidity verifier..."
mkdir -p contracts
snarkjs zkey export solidityverifier circuits/build/${CIRCUIT_NAME}_0001.zkey contracts/verifier.sol

print_status "Copying files for frontend..."
mkdir -p public/circuits
cp circuits/build/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm public/circuits/
cp circuits/build/${CIRCUIT_NAME}_0001.zkey public/circuits/
cp circuits/build/verification_key.json public/circuits/

print_success "🎉 Circuit compilation completed successfully!"