import "./global.css";
import { Router, autoRegisterComponents } from "@blitz-ts";
import { IndexPage } from "./components/IndexPage";
import { AuthPage } from "./components/AuthPage";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";

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
	.addRoute({
		path: "/auth",
		component: AuthPage,
		children: [
			{
				path: "/signup",
				component: SignUpPage,
			},
			{
				path: "/signin",
				component: SignInPage,
			},
		]
	})


	// Initialize the router after all routes are added
	router.init();
}
