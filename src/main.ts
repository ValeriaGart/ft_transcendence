import "./global.css";
import { Router, autoRegisterComponents } from "@blitz-ts";
import { IndexPage } from "./components/IndexPage";
import { AuthPage } from "./components/AuthPage";
import { SignUpPage } from "./components/SignUpPage";
import { SignInPage } from "./components/SignInPage";
import { GreatSuccessPage } from "./components/GreatSuccessPage";
import { UserPage } from "./components/UserPage";
import { SettingsPage } from "./components/SettingsPage";
import { GamePage } from "./components/GamePage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ViewPage } from "./components/ViewPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StartGamePopUp } from "./components/StartGamePopUp";
import { registerComponent } from "./lib/blitz-ts/componentRegistry";


// Register all components automatically
autoRegisterComponents().then(() => {

  // Manually register StartGamePopUp if it wasn't auto-registered
  if (!customElements.get('blitz-start-game-popup')) {
    console.log('Manually registering StartGamePopUp component...');
    registerComponent('blitz-start-game-popup', StartGamePopUp);
    console.log('StartGamePopUp manually registered');
  }
  

  // Expose a simple global navigation helper for inline templates
  (window as any).blitzNavigate = (path: string) => Router.getInstance().navigate(path);
});

// Create global ErrorBoundary
const globalErrorBoundary = new ErrorBoundary({
    onError: (error, errorInfo) => {
        console.error('Global ErrorBoundary caught an error:', error, errorInfo);
    }
});

// Mount global ErrorBoundary to document.body
globalErrorBoundary.mount(document.body);

console.log('Global ErrorBoundary mounted to document.body');

window.addEventListener('beforeunload', () => {
    globalErrorBoundary.unmount();
});


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
		path: "/game",
		component: GamePage,
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
			{
				path: "/game",
				component: GamePage,
			}
		]
	})
	.addRoute({
		path: "/view/:nickname",
		component: ViewPage,
	})

	// Initialize the router after all routes are added
	router.init();
}
