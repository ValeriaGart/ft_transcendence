import "./global.css";
import { Router } from "./lib/blitz-ts/router";

import { autoRegisterComponents } from "./lib/blitz-ts/autoRegister";
import { IndexPage } from "./components/IndexPage";

// Register all components automatically
autoRegisterComponents();

const app = document.querySelector<HTMLDivElement>("#blitz");

if (app) {
	// Initialize router and add routes
	const router = Router.getInstance(app);

	// Add routes with nested structure
	router
  .addRoute({ 
    path: '/', 
    component: IndexPage,
  })

	// Initialize the router after all routes are added
	router.init();
}
