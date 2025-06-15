import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { htmlTemplatePlugin } from "./src/lib/blitz-ts/plugins/html-template";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [tailwindcss(), htmlTemplatePlugin()],
	server: {
		host: "0.0.0.0",
	},
	resolve: {
		alias: {
			"@blitz-ts": resolve(__dirname, "./src/lib/blitz-ts")
		}
	}
});
