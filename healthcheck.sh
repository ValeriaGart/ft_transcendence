#!/bin/bash
set -e

# # ## this healthcheck only works for https

# Check backend
curl -sfk https://localhost:3443/health > /dev/null

# Check frontend
curl -sfk https://localhost:5173/health > /dev/null