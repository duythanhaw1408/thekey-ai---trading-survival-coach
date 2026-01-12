#!/bin/bash
# THEKEY Deployment Script
# Run this after pushing to main branch

set -e

echo "=================================="
echo "🚀 THEKEY Deployment Script"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Git status
echo -e "\n${YELLOW}Step 1: Git Status${NC}"
git status --short

# Step 2: Stage all changes
echo -e "\n${YELLOW}Step 2: Stage Changes${NC}"
read -p "Stage all changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    echo -e "${GREEN}✅ Changes staged${NC}"
fi

# Step 3: Commit
echo -e "\n${YELLOW}Step 3: Commit${NC}"
read -p "Enter commit message [default: 'Upgrade: Phases 1-4 complete']: " commit_msg
commit_msg=${commit_msg:-"Upgrade: Phases 1-4 complete"}
git commit -m "$commit_msg"
echo -e "${GREEN}✅ Committed${NC}"

# Step 4: Push
echo -e "\n${YELLOW}Step 4: Push to Remote${NC}"
read -p "Push to origin/main? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✅ Pushed to origin/main${NC}"
fi

echo -e "\n${GREEN}=================================="
echo "🎉 Deployment Initiated!"
echo "==================================${NC}"
echo ""
echo "Next Steps (after deploy completes):"
echo "  1. Connect to Render console"
echo "  2. Run migrations: alembic upgrade head"
echo "  3. Seed KB: python -m scripts.seed_kb"
echo "  4. Test endpoints"
echo ""
echo "Monitor deployment at: https://dashboard.render.com"
