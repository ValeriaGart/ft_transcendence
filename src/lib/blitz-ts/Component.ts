import { parseTemplate } from './templateParser';
import { DataBinding } from './dataBinding';

/**
 * Type definition for event handler functions
 */
type EventHandler = (event: Event) => void;

/**
 * Configuration options for event listeners
 */
type EventOptions = {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
};

/**
 * Represents a bound event with its handler and options
 */
type EventBinding = {
  handler: EventHandler;
  options: EventOptions;
};

// Pre-load all component templates from the filesystem
const templates = import.meta.glob<string>('/src/components/*/template.html', { eager: true, query: '?raw', import: 'default' });
console.log('Loaded templates:', Object.keys(templates));

/**
 * Base Component class that provides core functionality for UI components
 * 
 * This abstract class implements a lightweight component system with:
 * - Template-based rendering
 * - State and props management
 * - Event handling
 * - Data binding
 * - Lifecycle hooks
 * 
 * @template Props - Type of the component's props
 * @template State - Type of the component's state
 */
export abstract class Component<Props extends Record<string, any> = Record<string, any>, State extends Record<string, any> = Record<string, any>> {
  /** The root DOM element of the component */
  protected element: HTMLElement;
  
  /** The component's internal state */
  protected state: State;
  
  /** The component's props passed from parent */
  protected props: Props;
  
  /** The component's children */
  protected children: HTMLElement[] = [];
  
  /** Map of bound elements for data binding */
  private boundElements: Map<string, HTMLElement> = new Map();
  
  /** Map of event listeners organized by selector and event type */
  private eventListeners: Map<string, Map<string, Set<EventBinding>>> = new Map();
  
  /** Set of cleanup functions to run on unmount */
  private cleanupFunctions: Set<() => void> = new Set();
  
  /** Set of state properties that affect component structure */
  private structuralProperties: Set<keyof State> = new Set();
  
  /** Set of variables found in the template */
  private templateVariables: Set<string> = new Set();

  /**
   * Creates a new Component instance
   * @param props - Initial props for the component
   * @param children - Child elements to be rendered inside this component
   */
  constructor(props: Props = {} as Props, children: HTMLElement[] = []) {
    // Create a temporary div to parse the template
    const tempDiv = document.createElement('div');
    this.props = props;
    this.children = children;
    // Initialize state from the static definition
    this.state = (this.constructor as typeof Component<Props, State>).state as State;
    
    // Get the component name from the constructor
    const componentName = this.constructor.name;
    
    // Find the template path that matches this component
    const templatePath = `/src/components/${componentName}/template.html`;
    console.log('Loading template from:', templatePath);
    const template = templates[templatePath];
    
    if (!template) {
      throw new Error(`Template not found for component: ${componentName}`);
    }

    console.log('Processing template with state:', this.state);
    tempDiv.innerHTML = this.processTemplate(template);
    console.log('Processed template result:', tempDiv.innerHTML);
    
    // Use the first element from the template as the root element
    this.element = tempDiv.firstElementChild as HTMLElement || tempDiv;
    
    // Find the slot element and replace it with children
    const slot = this.element.querySelector('blitz-slot');
    if (slot && this.children.length > 0) {
      slot.replaceWith(...this.children);
    }
    
    // Re-bind all elements with their current values
    this.boundElements.forEach((element, property) => {
      const isProp = property in this.props;
      const value = isProp ? this.props[property] : this.state[property];
      DataBinding.bind(element, { getValue: () => value }, property);
    });

    // Re-attach all event listeners to the new DOM
    this.eventListeners.forEach((eventMap, selector) => {
      const element = this.element.querySelector(selector);
      if (element) {
        eventMap.forEach((bindings, eventType) => {
          bindings.forEach(({ handler, options }) => {
            const wrappedHandler = (event: Event) => {
              if (options.preventDefault) event.preventDefault();
              if (options.stopPropagation) event.stopPropagation();
              handler(event);
            };
            element.addEventListener(eventType, wrappedHandler, options);
          });
        });
      }
    });

    this.render();
  }

  /**
   * Marks state properties as structural, meaning changes to them require a full re-render
   * This is useful for properties that affect the component's structure or template
   * 
   * @param properties - State properties that affect component structure
   */
  protected markStructural(...properties: Array<keyof State>): void {
    properties.forEach(prop => this.structuralProperties.add(prop));
  }

  /**
   * Static state definition that components should override
   * This provides the initial state for all instances of the component
   */
  protected static state: any = {};

  /**
   * Processes a template string with the current state and props
   * Extracts template variables and marks them as structural if they exist in state
   * 
   * @param template - The template string to process
   * @returns The processed template with variables replaced
   */
  protected processTemplate(template: string): string {
    // Extract template variables using regex
    const variableRegex = /{{([^}]+)}}/g;
    let match;
    while ((match = variableRegex.exec(template)) !== null) {
      this.templateVariables.add(match[1].trim());
    }

    // Automatically mark template variables as structural
    this.templateVariables.forEach(variable => {
      if (variable in this.state) {
        this.structuralProperties.add(variable as keyof State);
      }
    });

    // Combine state and props for template processing
    const templateData = { ...this.state, ...this.props };
    return parseTemplate(template, templateData);
  }

  /**
   * Updates the component's props and triggers a re-render
   * Props are immutable and can only be updated by the parent component
   * 
   * @param newProps - New props to merge with existing props
   */
  public setProps(newProps: Partial<Props>): void {
    this.props = { ...this.props, ...newProps };
    // Always re-render when props change
    this._processTemplateAndRender();
  }

  /**
   * Gets the current props object
   * @returns The current props
   */
  protected getProps(): Props {
    return this.props;
  }

  /**
   * Sets the children of this component
   * @param children - Child elements to be rendered inside this component
   */
  public setChildren(children: HTMLElement[]): void {
    this.children = children;
    this._processTemplateAndRender();
  }

  /**
   * Gets the current children of this component
   * @returns The current children elements
   */
  protected getChildren(): HTMLElement[] {
    return this.children;
  }

  /**
   * Internal method to process template and trigger render
   * This is called whenever the component needs to be re-rendered
   */
  private _processTemplateAndRender(): void {
    // Get the component name from the constructor
    const componentName = this.constructor.name;
    
    // Find the template path that matches this component
    const templatePath = `/src/components/${componentName}/template.html`;
    console.log('Loading template from:', templatePath);
    const template = templates[templatePath];
    
    if (!template) {
      throw new Error(`Template not found for component: ${componentName}`);
    }

    console.log('Processing template with state:', this.state);
    this.element.innerHTML = this.processTemplate(template);
    console.log('Processed template result:', this.element.innerHTML);
    
    // Find the slot element and replace it with children
    const slot = this.element.querySelector('blitz-slot');
    if (slot && this.children.length > 0) {
      slot.replaceWith(...this.children);
    }
    
    // Re-bind all elements with their current values
    this.boundElements.forEach((element, property) => {
      const isProp = property in this.props;
      const value = isProp ? this.props[property] : this.state[property];
      DataBinding.bind(element, { getValue: () => value }, property);
    });

    // Re-attach all event listeners to the new DOM
    this.eventListeners.forEach((eventMap, selector) => {
      const element = this.element.querySelector(selector);
      if (element) {
        eventMap.forEach((bindings, eventType) => {
          bindings.forEach(({ handler, options }) => {
            const wrappedHandler = (event: Event) => {
              if (options.preventDefault) event.preventDefault();
              if (options.stopPropagation) event.stopPropagation();
              handler(event);
            };
            element.addEventListener(eventType, wrappedHandler, options);
          });
        });
      }
    });

    this.render();
  }

  /**
   * Abstract render method that components must implement
   * Called after template processing to set up component-specific functionality
   */
  protected abstract render(): void;

  /**
   * Lifecycle method called when the component is mounted to the DOM
   * Override this method to set up data bindings and event listeners
   */
  protected onMount(): void {
    // Default implementation is empty
  }

  /**
   * Lifecycle method called when the component is unmounted from the DOM
   * Override this method to clean up resources, event listeners, or subscriptions
   */
  protected onUnmount(): void {
    // Default implementation is empty
  }

  /**
   * Mounts the component to a container element
   * This adds the component to the DOM and triggers the onMount lifecycle hook
   * 
   * @param container - The DOM element to mount this component to
   */
  public mount(container: HTMLElement): void {
    container.appendChild(this.element);
    this.onMount();
  }

  /**
   * Unmounts the component from its container and cleans up
   * This removes the component from the DOM and triggers cleanup
   */
  public unmount(): void {
    // Run all cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions.clear();
    
    // Remove all event listeners
    this.eventListeners.clear();
    
    // Call onUnmount before removing the element
    this.onUnmount();
    
    // Remove the element
    this.element.remove();
  }

  /**
   * Adds an event listener to an element within the component
   * The listener will be automatically re-attached on re-renders
   * 
   * @param selector - CSS selector for the element
   * @param eventType - Type of event to listen for
   * @param handler - Event handler function
   * @param options - Event options
   */
  protected addEventListener(
    selector: string,
    eventType: string,
    handler: EventHandler,
    options: EventOptions = {}
  ): void {
    if (!this.eventListeners.has(selector)) {
      this.eventListeners.set(selector, new Map());
    }
    const eventMap = this.eventListeners.get(selector)!;
    
    if (!eventMap.has(eventType)) {
      eventMap.set(eventType, new Set());
    }
    eventMap.get(eventType)!.add({ handler, options });

    const element = this.element.querySelector(selector);
    if (element) {
      const wrappedHandler = (event: Event) => {
        if (options.preventDefault) event.preventDefault();
        if (options.stopPropagation) event.stopPropagation();
        handler(event);
      };
      element.addEventListener(eventType, wrappedHandler, options);
    }
  }

  /**
   * Removes an event listener from an element
   * 
   * @param selector - CSS selector for the element
   * @param eventType - Type of event to remove
   * @param handler - Event handler function to remove
   * @param options - Event options that were used when adding the listener
   */
  protected removeEventListener(
    selector: string,
    eventType: string,
    handler: EventHandler,
    options: EventOptions = {}
  ): void {
    const eventMap = this.eventListeners.get(selector);
    if (!eventMap) return;

    const bindings = eventMap.get(eventType);
    if (!bindings) return;

    // Find and remove the specific binding
    const bindingToRemove = Array.from(bindings).find(
      binding => binding.handler === handler && 
      binding.options.capture === options.capture &&
      binding.options.once === options.once &&
      binding.options.passive === options.passive &&
      binding.options.preventDefault === options.preventDefault &&
      binding.options.stopPropagation === options.stopPropagation
    );

    if (bindingToRemove) {
      bindings.delete(bindingToRemove);
      
      // Remove the actual event listener from the element
      const element = this.element.querySelector(selector);
      if (element) {
        const wrappedHandler = (event: Event) => {
          if (options.preventDefault) event.preventDefault();
          if (options.stopPropagation) event.stopPropagation();
          handler(event);
        };
        element.removeEventListener(eventType, wrappedHandler, options);
      }

      // Clean up empty sets and maps
      if (bindings.size === 0) {
        eventMap.delete(eventType);
      }
      if (eventMap.size === 0) {
        this.eventListeners.delete(selector);
      }
    }
  }

  /**
   * Adds a cleanup function that will be called when the component is unmounted
   * Useful for cleaning up subscriptions, timers, or other resources
   * 
   * @param cleanup - Function to call during cleanup
   */
  protected addCleanup(cleanup: () => void): void {
    this.cleanupFunctions.add(cleanup);
  }

  /**
   * Binds a state property to an element for automatic updates
   * Supports one-way and two-way data binding
   * 
   * @param selector - CSS selector for the element to bind
   * @param property - State property to bind
   * @param options - Binding options including two-way binding and event type
   */
  protected bind(selector: string, property: string, options: { twoWay?: boolean; event?: string } = {}) {
    const element = this.element.querySelector(selector) as HTMLElement;
    if (!element) {
      console.warn(`Element not found for selector: ${selector}`);
      return;
    }

    this.boundElements.set(property as string, element);
    const isProp = property in this.props;
    
    // Create a bindable object that handles both getting and setting values
    const bindable = {
      getValue: () => isProp ? this.props[property] : this.state[property],
      setValue: options.twoWay ? (value: any) => {
        if (isProp) {
          console.warn('Cannot set prop values directly - props are immutable');
          return;
        }
        this.setState({ [property]: value } as Partial<State>);
      } : undefined
    };

    DataBinding.bind(element, bindable, property as string, options);
  }

  /**
   * Updates the component's state and triggers re-render if necessary
   * Only structural properties trigger a full re-render
   * 
   * @param newState - Partial state update
   */
  protected setState(newState: Partial<State>): void {
    this.state = { ...this.state, ...newState };
    
    // Update bound elements
    Object.entries(newState).forEach(([key, value]) => {
      const element = this.boundElements.get(key);
      if (element) {
        DataBinding.update(element, value);
      }
    });

    // Check if any structural properties have changed
    const needsReRender = Object.keys(newState).some(key => 
      this.structuralProperties.has(key as keyof State)
    );

    if (needsReRender) {
      this._processTemplateAndRender();
    }
  }

  /**
   * Gets the current state object
   * @returns The current state
   */
  protected getState(): State {
    return this.state;
  }

  /**
   * Gets the root element of the component
   * @returns The component's root DOM element
   */
  public getElement(): HTMLElement {
    return this.element;
  }
} 