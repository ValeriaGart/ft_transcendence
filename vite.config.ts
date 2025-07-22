import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { htmlTemplatePlugin } from "./src/lib/blitz-ts/plugins/html-template";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";
import tls from "tls";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check for SSL certificates and read them once at startup
function getSSLConfig() {
	const certPath = './ssl/server.crt';
	const keyPath = './ssl/server.key';
	
	try {
		// Read files directly - if they don't exist, fs.readFileSync will throw
		const certContent = fs.readFileSync(certPath);
		fs.readFileSync(keyPath); // Verify key file exists
		
		return {
			key: keyPath,
			cert: certPath,
			certContent // Return certificate content for proxy agent
		};
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log('\n❌ SSL certificates not found!');
			console.log('   Run: ./scripts/generate-ssl.sh');
			console.log('   Or disable SSL by setting SSL_ENABLED=false in .env\n');
		} else {
			console.log('\n❌ Failed to load SSL certificates:', error.message, '\n');
		}
		process.exit(1);
	}
}

// Read SSL certificate once at startup for proxy configuration
const sslConfig = getSSLConfig();
const caCertificate = sslConfig.certContent;

// Create HTTPS agent once at startup to avoid file reads on every request
const httpsAgent = new https.Agent({
	ca: caCertificate,
	// Security: Only skip hostname validation for localhost, use standard validation for other hosts
	// This prevents connections to malicious servers while allowing self-signed localhost certificates
	checkServerIdentity: (hostname, cert) => hostname === 'localhost' ? undefined : tls.checkServerIdentity(hostname, cert)
});

export default defineConfig({
	plugins: [tailwindcss(), htmlTemplatePlugin()],
	server: {
		host: "0.0.0.0",
		https: sslConfig,
		proxy: {
			'/api': {
				target: 'https://localhost:3443',
				changeOrigin: true,
				// Use pre-configured HTTPS agent (certificate read once at startup)
				agent: httpsAgent,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		}
	},
	resolve: {
		alias: {
			"@blitz-ts": resolve(__dirname, "./src/lib/blitz-ts")
		}
	}
});
