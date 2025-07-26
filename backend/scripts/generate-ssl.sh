#!/bin/bash

# SSL Certificate Generator for Backend Development
# This creates self-signed certificates for the backend server

set -e

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed"
    echo "Install with: sudo apt-get install openssl"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/../ssl"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR" || { echo "❌ Error: Cannot create SSL directory"; exit 1; }

# Check if certificates already exist and are valid
if [[ -f "$SSL_DIR/server.crt" && -f "$SSL_DIR/server.key" ]]; then
    if openssl x509 -in "$SSL_DIR/server.crt" -noout -checkend 86400 2>/dev/null; then
        echo "✅ Valid certificates already exist"
        read -p "Regenerate? (y/N): " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
    fi
fi

echo "🔐 Generating backend SSL certificates..."

# Generate self-signed certificate
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -keyout "$SSL_DIR/server.key" -out "$SSL_DIR/server.crt" \
    -days 365 -nodes \
    -subj "/C=US/ST=Development/L=Local/O=Transcendence/OU=Backend/CN=localhost" 2>/dev/null || {
    echo "❌ Error: Certificate generation failed"
    rm -f "$SSL_DIR/server.key" "$SSL_DIR/server.crt"
    exit 1
}

# Set permissions
chmod 600 "$SSL_DIR/server.key" 2>/dev/null || echo "⚠️  Warning: Cannot set key permissions"
chmod 644 "$SSL_DIR/server.crt" 2>/dev/null || echo "⚠️  Warning: Cannot set cert permissions"

# Validate certificates
openssl x509 -in "$SSL_DIR/server.crt" -noout -text &>/dev/null || {
    echo "❌ Error: Invalid certificate generated"
    rm -f "$SSL_DIR/server.key" "$SSL_DIR/server.crt"
    exit 1
}

echo "✅ Backend SSL certificates generated successfully!"
echo "   Certificate: $SSL_DIR/server.crt"
echo "   Private Key: $SSL_DIR/server.key"
echo "   Expires: $(openssl x509 -in "$SSL_DIR/server.crt" -noout -enddate | sed 's/notAfter=//')"
echo ""
echo "⚠️  Development certificates only - browsers will show warnings"
echo "🔒 Private key (.key) should NOT be committed to git"
