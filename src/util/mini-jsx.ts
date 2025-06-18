/**
 * Mini-JSX Framework Implementation
 * This is a lightweight JSX-like framework that provides basic component rendering and state management.
 * It supports functional components, event handling, and basic DOM manipulation.
 * 
 * Key Features:
 * 1. Functional Components: Support for React-like functional components
 * 2. State Management: Built-in state management system
 * 3. Event Handling: Support for DOM events
 * 4. DOM Manipulation: Create and update DOM elements
 * 5. JSX-like Syntax: Support for JSX-like syntax with props and children
 */

import { currentInstance, setCurrentInstance, type ComponentInstance } from "./state/state";

// Define valid child types that can be rendered in our JSX implementation
// This includes DOM nodes, primitive values, and null/undefined
type Child = Node | string | number | null | undefined | boolean;

// Type for component props with children
// The [key: string]: any allows for additional props to be passed
interface ComponentProps {
	children?: Child[];
	[key: string]: any; // it CAN be ANYthing
}

// Keep track of component instances for state management
// This map stores component instances with unique identifiers
const componentInstances = new Map<string, ComponentInstance>();

// Counter to generate unique IDs for component instances
let instanceCounter = 0;

/**
 * Main JSX factory function that creates DOM elements or renders components
 * This is the core function that handles both HTML elements and functional components.\
 * {@link https://en.wikipedia.org/wiki/JSDoc}
 * @param tag - HTML tag name or component function
 * @param props - Component properties and attributes
 * @param children - Child elements to be rendered
 * @returns HTMLElement
 */
export function myJSX(
	tag: string | Function,
	props: ComponentProps = {},
	...children: Child[]
): HTMLElement {
	// Handle functional components (React-like components)
	if (typeof tag === "function") {
		// Generate a unique ID for this component instance
		const instanceId = `${tag.name}_${instanceCounter++}`;
		
		// Get or create component instance for state management
		let instance = componentInstances.get(instanceId);
		if (!instance) {
			// Create a new component instance if it doesn't exist
			instance = {
				state: [], // Array to store component state
				cursor: 0, // Cursor to track state position
				root: null, // Reference to the root DOM element
				scheduled: false, // Flag to prevent multiple re-renders
				render: () => {
					// Reset cursor for new render
					instance!.cursor = 0;
					// Store previous instance and set current instance
					const prev = currentInstance;
					setCurrentInstance(instance!);
					try {
						// Call the component function with props and children
						const result = tag({ ...props, children });
						// Restore previous instance
						setCurrentInstance(prev);
						return result;
					} catch (error) {
						// Ensure instance is restored even if render fails
						setCurrentInstance(prev);
						console.error(`Error rendering component ${tag.name}:`, error);
						throw error;
					}
				}
			};
			componentInstances.set(instanceId, instance);
		}

		// Render the component and store its root element
		const el = instance.render();
		instance.root = el;
		return el;
	}

	// Create DOM element for HTML tags
	const element = document.createElement(tag);

	// Handle props and attributes
	for (const key in props) {
		if (key === "children") continue; // Skip children prop as it's handled separately
		
		if (key.startsWith("on") && typeof props[key] === "function") {
			// Handle event listeners (e.g., onClick, onMouseOver)
			// Convert camelCase to lowercase (e.g., onClick -> click)
			const eventName = key.substring(2).toLowerCase();
			element.addEventListener(eventName, props[key]);
		} else if (key === "className") {
			// Handle className prop (React-style)
			// Convert className to class attribute
			element.setAttribute("class", props[key]);
		} else if (key === "style" && typeof props[key] === "object") {
			// Handle style object
			// Apply all style properties to the element
			Object.assign(element.style, props[key]);
		} else {
			// Handle regular attributes
			// Set the attribute on the DOM element
			element.setAttribute(key, props[key]);
		}
	}

	// Process children
	// Flatten nested arrays and filter out null/undefined values
	const flattenedChildren = children.flat().filter(child => child != null);
	for (const child of flattenedChildren) {
		if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") {
			// Convert primitive values to text nodes
			const textNode = document.createTextNode(String(child));
			element.appendChild(textNode);
		} else if (child instanceof Node) {
			// Append DOM nodes directly
			element.appendChild(child);
		}
	}

	return element;
}

/**
 * Fragment component for grouping multiple elements without adding extra DOM nodes
 * Similar to React's Fragment, it allows returning multiple elements without a wrapper
 * 
 * @param props - Component props containing children
 * @returns Array of child elements
 */
export const Fragment = (props: { children: Child[] }) => props.children;
