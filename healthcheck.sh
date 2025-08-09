#!/bin/bash
set -e

# Check backend
# curl -sf http://localhost:3000/health > /dev/null
curl -sfk https://localhost:3443/health > /dev/null

# Check frontend
curl -sfk https://localhost:5173/health > /dev/null