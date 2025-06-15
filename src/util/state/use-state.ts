/**
 * React-like useState hook implementation
 * Manages component state and triggers re-renders on updates
 */

import { currentInstance, scheduleRender } from "./state";

/**
 * Creates a state variable with a setter function
 * @param initial - Initial state value
 * @returns [state, setState] tuple
 * @throws Error if called outside of a component
 */
export function useState<T>(initial: T): [T, (v: T | ((prev: T) => T)) => void] {
	if (!currentInstance)
		throw new Error("useState must be called inside a component");

	const i = currentInstance.cursor++;
	const instance = currentInstance;

	if (instance.state[i] === undefined) {
		instance.state[i] = initial;
	}

	const setState = (value: T | ((prev: T) => T)) => {
		const newValue = typeof value === "function" 
			? (value as (prev: T) => T)(instance.state[i])
			: value;

		if (instance.state[i] !== newValue) {
			instance.state[i] = newValue;
			scheduleRender(instance);
		}
	};

	return [instance.state[i], setState];
}

