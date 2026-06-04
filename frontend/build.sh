#!/bin/bash
# Vercel deployment script for frontend

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building application..."
npm run build

echo "Build complete! Ready for Vercel deployment."
