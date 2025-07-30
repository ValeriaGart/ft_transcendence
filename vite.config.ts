import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { htmlTemplatePlugin } from "./src/lib/blitz-ts/plugins/html-template";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";
import tls from "tls";
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '.env') });

// SSL setup: load certs if SSL_ENABLED=true
const sslEnabled = process.env.SSL_ENABLED === 'true';
let sslConfig: object | null = null, httpsAgent: https.Agent | undefined;

if (sslEnabled) {
	try {
		const certContent = fs.readFileSync('./backend/ssl/server.crt');
		// Validate that the server key file exists and is readable
		fs.readFileSync('./backend/ssl/server.key');
		
		sslConfig = { key: './backend/ssl/server.key', cert: './backend/ssl/server.crt' };
		httpsAgent = new https.Agent({
			ca: certContent,
			checkServerIdentity: (hostname, cert) => hostname === 'localhost' ? undefined : tls.checkServerIdentity(hostname, cert)
		});
		console.log('🔒 SSL enabled - using HTTPS');
	} catch (error: any) {
		console.log(error.code === 'ENOENT' 
			? '\n❌ SSL certificates not found! Run: ./backend/scripts/generate-ssl.sh\n'
			: `\n❌ SSL error: ${error.message}\n`);
		process.exit(1);
	}
} else {
	console.log('🌐 SSL disabled - running in HTTP mode');
}

export default defineConfig({
	plugins: [tailwindcss(), htmlTemplatePlugin()],
	server: {
		host: "0.0.0.0",
		...(sslConfig && { https: sslConfig }),
		proxy: {
			'/api': {
				target: sslEnabled ? 'https://localhost:3443' : 'http://localhost:3000',
				changeOrigin: true,
				...(httpsAgent && { agent: httpsAgent }),
				rewrite: (path) => path.replace(/^\/api/, '')
			},
			'/ws': {
				target: sslEnabled ? 'wss://localhost:3443' : 'ws://localhost:3000',
				ws: true,
				changeOrigin: true,
				...(httpsAgent && { agent: httpsAgent }),
				rewrite: (path) => path.replace(/^\/ws/, '')
			}
		}
	},
	resolve: {
		alias: { "@blitz-ts": resolve(__dirname, "./src/lib/blitz-ts") }
	}
});
