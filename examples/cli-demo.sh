#!/usr/bin/env bash
# AskVerdict CLI Demo
# Requires: ASKVERDICT_TOKEN environment variable

set -euo pipefail

echo "=== AskVerdict CLI Demo ==="
echo ""

# Check API health (no auth needed)
echo "1. Checking API health..."
askverdict health
echo ""

# Run a quick debate
echo "2. Starting a fast debate..."
askverdict debate "TypeScript vs JavaScript for a new Node.js backend?" --mode fast
echo ""

# List recent debates
echo "3. Listing recent debates..."
askverdict list --limit 5
echo ""

# Show account info
echo "4. Account info..."
askverdict whoami
echo ""

echo "=== Demo complete ==="
