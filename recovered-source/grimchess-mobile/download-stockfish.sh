#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STOCKFISH_DIR="$DIR/public/stockfish"
mkdir -p "$STOCKFISH_DIR"

echo "Downloading Stockfish 16 NNUE WASM..."

# Official Stockfish WASM builds from npm stockfish package
# We extract the WASM files from the stockfish npm package
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

npm pack stockfish@16.0.0
tar -xzf stockfish-16.0.0.tgz

cp package/src/stockfish-nnue-16.js "$STOCKFISH_DIR/"
cp package/src/stockfish-nnue-16.wasm "$STOCKFISH_DIR/"

# Also copy the single-threaded version as fallback
cp package/src/stockfish-nnue-16-single.js "$STOCKFISH_DIR/" 2>/dev/null || true
cp package/src/stockfish-nnue-16-single.wasm "$STOCKFISH_DIR/" 2>/dev/null || true

cd "$DIR"
rm -rf "$TMP_DIR"

echo "Stockfish WASM downloaded to $STOCKFISH_DIR"
ls -la "$STOCKFISH_DIR"
