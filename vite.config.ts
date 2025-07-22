import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { htmlTemplatePlugin } from "./src/lib/blitz-ts/plugins/html-template";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), htmlTemplatePlugin()],
	server: {
		host: "0.0.0.0",
		https: {
			key: './ssl/server.key',
			cert: './ssl/server.crt'
		},
		proxy: {
			'/api': {
				target: 'https://localhost:3443',
				changeOrigin: true,
				// Use custom HTTPS agent with self-signed certificate validation
				agent: new https.Agent({
					ca: fs.existsSync('./ssl/server.crt') ? fs.readFileSync('./ssl/server.crt') : undefined,
					checkServerIdentity: () => undefined // Skip hostname validation for localhost
				}),
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
