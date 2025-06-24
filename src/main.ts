import "./global.css";
import { Router, autoRegisterComponents } from "@blitz-ts";
import { IndexPage } from "./components/IndexPage";
import { AuthPage } from "./components/AuthPage";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";
import { GreatSuccessPage } from "./components/GreatSuccessPage";
import { UserPage } from "./components/UserPage";
import { ErrorBoundary } from "./components/ErrorBoundary";


// Register all components automatically
autoRegisterComponents();

console.log('Setting up global ErrorBoundary...');

// Create global ErrorBoundary
const globalErrorBoundary = new ErrorBoundary({
    onError: (error, errorInfo) => {
        console.error('Global ErrorBoundary caught an error:', error, errorInfo);
    }
});

console.log('Global ErrorBoundary created:', globalErrorBoundary);

// Mount global ErrorBoundary to document.body
globalErrorBoundary.mount(document.body);

console.log('Global ErrorBoundary mounted to document.body');


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
			{
				path: "/greatsuccess",
				component: GreatSuccessPage,
			},
		]
	})
	.addRoute({
		path: "/user",
		component: UserPage,
	})

	// Initialize the router after all routes are added
	router.init();
}
