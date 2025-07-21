#!/bin/bash

# Simple SSL Certificate Generator for Development
# This creates self-signed certificates that are safe to commit to git

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/../ssl"

echo "🔐 Generating development SSL certificates..."

# Create SSL directory
mkdir -p "$SSL_DIR"

# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout "$SSL_DIR/server.key" -out "$SSL_DIR/server.crt" \
    -days 365 -nodes \
    -subj "/C=US/ST=Development/L=Local/O=Transcendence/OU=Dev/CN=localhost"

# Set permissions
chmod 600 "$SSL_DIR/server.key"
chmod 644 "$SSL_DIR/server.crt"

echo "✅ SSL certificates generated:"
echo "   Certificate: $SSL_DIR/server.crt"
echo "   Private Key: $SSL_DIR/server.key"
echo ""
echo "⚠️  These are development certificates only!"
echo "   Browsers will show security warnings."
echo ""
echo "🔒 The private key (.key) should NOT be committed to git."
echo "📜 The certificate (.crt) can be safely committed."
