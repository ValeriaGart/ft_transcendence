/**
 * State Management System
 * Handles component state and rendering lifecycle
 */

export interface ComponentInstance {
	render: () => HTMLElement;
	state: any[];
	cursor: number;
	root: HTMLElement | null;
	scheduled: boolean;
	cleanup?: () => void; // For cleanup functions
}

// Current component instance being rendered
export let currentInstance: ComponentInstance | null = null;

/**
 * Sets the current component instance being rendered
 * @param i - Component instance or null
 */
export function setCurrentInstance(i: ComponentInstance | null) {
	currentInstance = i;
}

// Queue for components that need to be re-rendered
const updateQueue: Set<ComponentInstance> = new Set();

/**
 * Schedules a component for re-rendering
 * Uses microtask queue to batch updates
 * @param instance - Component instance to schedule
 */
export function scheduleRender(instance: ComponentInstance) {
	if (instance.scheduled) return;
	instance.scheduled = true;
	updateQueue.add(instance);

	queueMicrotask(() => {
		try {
			for (const inst of updateQueue) {
				// Run cleanup if exists
				if (inst.cleanup) {
					inst.cleanup();
				}

				const newEl = inst.render();
				if (inst.root && newEl !== inst.root) {
					inst.root.replaceWith(newEl);
					inst.root = newEl;
				}
				inst.scheduled = false;
			}
		} catch (error) {
			console.error('Error during component update:', error);
		} finally {
			updateQueue.clear();
		}
	});
}

/**
 * useState hook for managing component state
 * Similar to React's useState, but simplified for our needs
 * @param initialValue - Initial state value
 * @returns [currentState, setState] tuple
 */
export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
	if (!currentInstance) {
		throw new Error('useState must be called inside a component');
	}

	const instance = currentInstance;
	const cursor = instance.cursor;

	// Initialize state if it doesn't exist
	if (instance.state[cursor] === undefined) {
		instance.state[cursor] = initialValue;
	}

	// Create setState function
	const setState = (newValue: T) => {
		instance.state[cursor] = newValue;
		scheduleRender(instance);
	};

	// Increment cursor for next state
	instance.cursor++;

	return [instance.state[cursor], setState];
}
