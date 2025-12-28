#!/bin/bash
set -e

echo "Installing Python dependencies for PDF parsing..."

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python not found. Python 3.10+ is required."
    exit 1
fi

echo "✓ Found Python: $($PYTHON_CMD --version)"

# Check if pip is available
if command -v pip3 &> /dev/null; then
    PIP_CMD="pip3"
elif command -v pip &> /dev/null; then
    PIP_CMD="pip"
else
    echo "❌ pip not found"
    exit 1
fi

echo "✓ Found pip: $($PIP_CMD --version)"

# Install Python dependencies
echo "Installing monopoly-core and dependencies..."
$PIP_CMD install --user -r requirements.txt || {
    echo "⚠️  Failed to install with --user, trying without..."
    $PIP_CMD install -r requirements.txt
}

echo "✅ Python dependencies installed successfully!"
