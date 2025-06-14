import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss()],
	esbuild: {
		jsxFactory: "myJSX",
		jsxFragment: "Fragment",
	},
	server: {
		host: "0.0.0.0",
	}
});
