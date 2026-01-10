#!/bin/bash
# deploy.sh

echo "🚀 Starting Deployment of THEKEY AI Agent..."

# 1. Check for required environment variables
if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY is not set."
    exit 1
fi

# 2. Backend Deployment (Railway assumes you have the CLI installed and linked)
echo "📦 Deploying Backend to Railway..."
railway up --detach

# 3. Frontend Deployment (Vercel assumes you have the CLI installed)
echo "🎨 Deploying Frontend to Vercel..."
vercel --prod --yes

echo "✅ Deployment Process Initiated!"
