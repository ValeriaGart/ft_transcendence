import { Component } from './Component';

/**
 * Interface for objects that can be bound to DOM elements
 * Provides getter and optional setter for the bound value
 */
interface Bindable {
  /** Gets the current value */
  getValue(): any;
  /** Optional setter for the value */
  setValue?: (value: any) => void;
}

/**
 * Configuration options for data binding
 */
interface BindingOptions {
  /** Whether to enable two-way binding */
  twoWay?: boolean;
  /** The event type to listen for in two-way binding (defaults to 'input') */
  event?: string;
}

/**
 * Utility class for handling data binding between DOM elements and data sources
 * Supports one-way and two-way binding for form elements and text content
 */
export class DataBinding {
  /**
   * Binds a data source to a DOM element
   * Sets up initial value and optionally configures two-way binding
   * 
   * @param element - The DOM element to bind to
   * @param source - The data source to bind from
   * @param property - The property name for debugging/logging
   * @param options - Binding configuration options
   */
  static bind(element: HTMLElement, source: Bindable, property: string | symbol, options: BindingOptions = {}): void {
    // Set initial value
    this.update(element, source.getValue());

    // Set up two-way binding if requested
    if (options.twoWay && source.setValue) {
      const eventType = options.event || 'input';
      
      const handleInput = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = target.value;
        source.setValue!(value);
      };

      element.addEventListener(eventType, handleInput);
    }
  }

  /**
   * Updates a DOM element with a new value
   * Handles both form elements (input, textarea) and regular elements
   * 
   * @param element - The DOM element to update
   * @param value - The new value to set
   */
  static update(element: HTMLElement, value: any): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
    } else {
      element.textContent = value;
    }
  }
} 