#!/bin/bash


# SSL Certificate Generator for Backend Development
# This script creates a CA and uses it to sign a backend server certificate

set -e

# Check if OpenSSL is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: OpenSSL is not installed"
    echo "Install with: sudo apt-get install openssl"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/../ssl"
CA_KEY="$SSL_DIR/ca.key"
CA_CERT="$SSL_DIR/ca.crt"
SERVER_KEY="$SSL_DIR/server.key"
SERVER_CSR="$SSL_DIR/server.csr"
SERVER_CERT="$SSL_DIR/server.crt"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR" || { echo "❌ Error: Cannot create SSL directory"; exit 1; }

# Check if certificates already exist and are valid
if [[ -f "$SERVER_CERT" && -f "$SERVER_KEY" && -f "$CA_CERT" && -f "$CA_KEY" ]]; then
    if openssl x509 -in "$SERVER_CERT" -noout -checkend 86400 2>/dev/null; then
        echo "✅ Valid certificates already exist (signed by CA)"
        read -p "Regenerate? (y/N): " -n 1 -r
        echo
        [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
    fi
fi

echo "🔐 Generating CA and backend SSL certificates..."

# Get your computer's primary IPv4 address
IP_ADDR=$(ip -4 addr show scope global | grep inet | awk '{print $2}' | cut -d/ -f1 | head -n1)

# Create a temporary OpenSSL config with SAN for localhost and your IP
SAN_CONFIG="$SSL_DIR/san.cnf"
cat > "$SAN_CONFIG" <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
[req_distinguished_name]
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost
IP.1 = $IP_ADDR
EOF

# 1. Generate CA key and certificate if not present
if [[ ! -f "$CA_KEY" || ! -f "$CA_CERT" ]]; then
    echo "🔑 Generating new CA private key and certificate..."
    openssl req -x509 -newkey rsa:4096 -days 1825 -nodes \
        -keyout "$CA_KEY" -out "$CA_CERT" \
        -subj "/C=AT/ST=Vienna/L=Vienna/O=Transcendence/OU=DevCA/CN=TranscendenceDevCA" 2>/dev/null || {
        echo "❌ Error: CA certificate generation failed"
        rm -f "$CA_KEY" "$CA_CERT"
        exit 1
    }
    chmod 600 "$CA_KEY"
    chmod 644 "$CA_CERT"
    echo "✅ CA certificate generated: $CA_CERT"
fi

# 2. Generate server key and CSR
echo "🔑 Generating server private key and CSR..."
openssl ecparam -genkey -name prime256v1 -out "$SERVER_KEY" 2>/dev/null || {
    echo "❌ Error: Server key generation failed"; rm -f "$SERVER_KEY"; exit 1; }
openssl req -new -key "$SERVER_KEY" -out "$SERVER_CSR" \
    -subj "/C=AT/ST=Vienna/L=Vienna/O=Transcendence/OU=Backend/CN=localhost" \
    -config "$SAN_CONFIG" -reqexts v3_req 2>/dev/null || {
    echo "❌ Error: CSR generation failed"; rm -f "$SERVER_KEY" "$SERVER_CSR"; exit 1; }

# 3. Sign server CSR with CA (include SAN)
echo "🖋️  Signing server certificate with CA..."
openssl x509 -req -in "$SERVER_CSR" -CA "$CA_CERT" -CAkey "$CA_KEY" -CAcreateserial \
    -out "$SERVER_CERT" -days 365 -sha256 -extfile "$SAN_CONFIG" -extensions v3_req 2>/dev/null || {
    echo "❌ Error: Server certificate signing failed"; rm -f "$SERVER_KEY" "$SERVER_CERT" "$SERVER_CSR"; exit 1; }
rm -f "$SERVER_CSR" "$SSL_DIR/ca.srl" "$SAN_CONFIG"

# Set permissions
chmod 600 "$SERVER_KEY" 2>/dev/null || echo "⚠️  Warning: Cannot set key permissions"
chmod 644 "$SERVER_CERT" 2>/dev/null || echo "⚠️  Warning: Cannot set cert permissions"

# Validate certificates
openssl x509 -in "$SERVER_CERT" -noout -text &>/dev/null || {
    echo "❌ Error: Invalid server certificate generated"
    rm -f "$SERVER_KEY" "$SERVER_CERT"
    exit 1
}
openssl x509 -in "$CA_CERT" -noout -text &>/dev/null || {
    echo "❌ Error: Invalid CA certificate generated"
    rm -f "$CA_KEY" "$CA_CERT"
    exit 1
}

echo "✅ Backend SSL certificates generated and signed by CA!"
echo "   Server Certificate: $SERVER_CERT"
echo "   Server Private Key: $SERVER_KEY"
echo "   CA Certificate: $CA_CERT"
echo "   Expires: $(openssl x509 -in "$SERVER_CERT" -noout -enddate | sed 's/notAfter=//')"
echo ""
echo "⚠️  To trust this CA on your system, run:"
echo "   sudo cp $CA_CERT /usr/local/share/ca-certificates/transcendence-ca.crt && sudo update-ca-certificates"
echo "   (You may need to restart your browser/system for changes to take effect)"
echo ""
echo "🔒 Private keys (.key) should NOT be committed to git"
