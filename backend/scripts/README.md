# SSL Certificate Setup Guide

This project uses a custom Certificate Authority (CA) to generate SSL certificates for local and LAN development.

## 1. Generate Certificates

Run the following command to generate the CA and server certificates:

```bash
make setup-certs
```

This will:
- Create a CA certificate (`backend/ssl/ca.crt`)
- Create a server certificate (`backend/ssl/server.crt`) and key (`backend/ssl/server.key`)
- Add your computer's IP to the certificate's valid domains

## 2. Trust the CA on your System

To avoid browser warnings, you need to trust the CA certificate:

**Method 1 (Standard):**
```bash
sudo cp backend/ssl/ca.crt /usr/local/share/ca-certificates/transcendence-ca.crt
sudo update-ca-certificates
```

**Method 2 (If Method 1 doesn't work - e.g., on VMs):**
```bash
sudo mkdir -p /usr/share/ca-certificates/extra
sudo cp backend/ssl/ca.crt /usr/share/ca-certificates/extra/transcendence-ca.crt
echo "extra/transcendence-ca.crt" | sudo tee -a /etc/ca-certificates.conf
sudo update-ca-certificates
```

You may need to restart your browser or your system for changes to take effect.

## 3. Trust the CA in Firefox

On Linux, Firefox uses its own certificate store. To trust the CA in Firefox:

1. Open Firefox and go to `about:preferences#privacy`
2. Scroll down to "Certificates" and click "View Certificates"
3. Go to the "Authorities" tab and click "Import"
4. Select `backend/ssl/ca.crt`
5. Check "Trust this CA to identify websites" and confirm

Restart Firefox completely (close all windows, not just tabs).

## 4. Access the Website

You can now access your site securely at:

```
https://<your-ip>:5173
```

If you want to share access, others must also trust your CA certificate on their devices.

---

**Note:**  
Never commit `.key` files to version control.  
If you regenerate certificates, repeat the trust steps
