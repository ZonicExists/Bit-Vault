#!/bin/bash

# 🔐 Secure Vault Frontend - Quick Start Script

echo "================================"
echo "🔐 Secure Vault Frontend"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v14+"
    echo "   Visit: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js installed: $(node -v)"
echo "✅ npm installed: $(npm -v)"
echo ""

# Navigate to project
cd "$(dirname "$0")"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Show project structure
echo "📁 Project Structure:"
echo "   src/"
echo "   ├── components/    (7 React components)"
echo "   ├── context/       (Global state with React Context)"
echo "   ├── services/      (API integration)"
echo "   ├── types/         (TypeScript type definitions)"
echo "   └── App.tsx        (Root component)"
echo ""

# Show available commands
echo "🚀 Available Commands:"
echo ""
echo "   npm start       - Start development server (http://localhost:3000)"
echo "   npm run build   - Build for production"
echo "   npm test        - Run tests"
echo "   npm run eject   - Eject from Create React App (not recommended)"
echo ""

# Prompt to start
echo "================================"
read -p "Start development server? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting development server..."
    echo "   Opening http://localhost:3000 in your browser"
    echo ""
    echo "Make sure the backend is running on http://localhost:4000"
    echo ""
    npm start
else
    echo ""
    echo "To start the development server, run:"
    echo "   npm start"
    echo ""
    echo "Check out README_FRONTEND.md for more information!"
fi
