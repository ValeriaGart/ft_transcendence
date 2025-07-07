import "./global.css";
import { Router, autoRegisterComponents } from "@blitz-ts";
import { IndexPage } from "./components/IndexPage";
import { AuthPage } from "./components/AuthPage";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";
import { GreatSuccessPage } from "./components/GreatSuccessPage";
import { UserPage } from "./components/UserPage";
import { SettingsPage } from "./components/SettingsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { authService } from "./lib/auth";


// Register all components automatically
autoRegisterComponents();

console.log('=== APP STARTUP DEBUG ===');
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);
console.log('Stored token:', localStorage.getItem('auth_token') ? 'exists' : 'none');
console.log('Stored user:', localStorage.getItem('auth_user') ? 'exists' : 'none');
console.log('AuthService state:', authService.getAuthState());
console.log('=== END DEBUG ===');

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
	})
	.addRoute({
		path: "/signup",
		component: SignUpPage,
	})
	.addRoute({
		path: "/signin",
		component: SignInPage,
	})
	.addRoute({
		path: "/greatsuccess",
		component: GreatSuccessPage,
	})
	.addRoute({
		path: "/user",
		component: ProtectedRoute,
		children: [
			{
				path: "",
				component: UserPage,
			},
			{
				path: "/settings",
				component: SettingsPage,
			},
		]
	})

	// Initialize the router after all routes are added
	router.init();
}
