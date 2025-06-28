#!/bin/bash

# Script untuk copy circuit files ke public directory

echo "🔧 Copying circuit files to public directory..."

# Create directory structure
mkdir -p public/circuits/build/ageVerification_js/
mkdir -p public/circuits/build/

# Copy WASM file
if [ -f "circuits/build/ageVerification_js/ageVerification.wasm" ]; then
    cp circuits/build/ageVerification_js/ageVerification.wasm public/circuits/build/ageVerification_js/
    echo "✅ Copied ageVerification.wasm"
else
    echo "❌ ageVerification.wasm not found in circuits/build/ageVerification_js/"
fi

# Copy zkey file
if [ -f "circuits/build/ageVerification_0001.zkey" ]; then
    cp circuits/build/ageVerification_0001.zkey public/circuits/build/
    echo "✅ Copied ageVerification_0001.zkey"
else
    echo "❌ ageVerification_0001.zkey not found in circuits/build/"
fi

# Copy verification key
if [ -f "circuits/build/verification_key.json" ]; then
    cp circuits/build/verification_key.json public/circuits/build/
    echo "✅ Copied verification_key.json"
else
    echo "❌ verification_key.json not found in circuits/build/"
fi

# Copy witness calculator (optional)
if [ -f "circuits/build/ageVerification_js/witness_calculator.js" ]; then
    cp circuits/build/ageVerification_js/witness_calculator.js public/circuits/build/ageVerification_js/
    echo "✅ Copied witness_calculator.js"
fi

# Copy generate_witness.js (optional)
if [ -f "circuits/build/ageVerification_js/generate_witness.js" ]; then
    cp circuits/build/ageVerification_js/generate_witness.js public/circuits/build/ageVerification_js/
    echo "✅ Copied generate_witness.js"
fi

echo ""
echo "📁 Files copied to public/circuits/build/"
echo "Structure:"
echo "public/"
echo "└── circuits/"
echo "    └── build/"
echo "        ├── ageVerification_js/"
echo "        │   ├── ageVerification.wasm"
echo "        │   ├── witness_calculator.js"
echo "        │   └── generate_witness.js"
echo "        ├── ageVerification_0001.zkey"
echo "        └── verification_key.json"

echo ""
echo "🚀 Circuit files ready for frontend!"
echo "You can now test the ZK proof generation."