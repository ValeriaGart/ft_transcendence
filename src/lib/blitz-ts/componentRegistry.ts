type ComponentConstructor = new (props?: any, children?: HTMLElement[]) => any;

class ComponentRegistry {
  private static components: Map<string, ComponentConstructor> = new Map();

  static register(tagName: string, componentClass: ComponentConstructor) {
    this.components.set(tagName, componentClass);
  }

  static get(tagName: string): ComponentConstructor | undefined {
    return this.components.get(tagName);
  }
}

// Create a unique custom element class for each component
function createCustomElementClass(ComponentClass: ComponentConstructor) {
  return class extends HTMLElement {
    private component: any;
    private observedAttributes: string[] = [];

    static get observedAttributes() {
      // Get all attributes from the element
      const prototype = Object.getPrototypeOf(this);
      return prototype.observedAttributes || [];
    }

    constructor() {
      super();
      // Get all attributes and convert them to props
      const props: Record<string, any> = {};
      Array.from(this.attributes).forEach(attr => {
        const value = this.parseAttributeValue(attr.value);
        props[attr.name] = value;
      });

      // Create child components from child elements
      const children: HTMLElement[] = [];
      Array.from(this.children).forEach(child => {
        if (child instanceof HTMLElement) {
          children.push(child);
        }
      });

      this.component = new ComponentClass(props, children);
    }

    connectedCallback() {
      // Store the original children
      const originalChildren = Array.from(this.children);
      
      // Clear the element
      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      // Mount the component
      this.component.mount(this);

      // Wait for the next frame to ensure the component is rendered
      requestAnimationFrame(() => {
        // Find the slot element
        const slot = this.querySelector('blitz-slot');
        if (slot) {
          // Replace the slot with the original children
          slot.replaceWith(...originalChildren);
        }
      });
    }

    disconnectedCallback() {
      if (this.component) {
        this.component.unmount();
      }
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (this.component) {
        const parsedValue = this.parseAttributeValue(newValue);
        this.component.setProps({ [name]: parsedValue });
      }
    }

    private parseAttributeValue(value: string): any {
      // Try to parse as JSON first
      try {
        return JSON.parse(value);
      } catch {
        // If not valid JSON, return as is
        return value;
      }
    }
  };
}

// Register custom elements
export function registerComponent(tagName: string, componentClass: ComponentConstructor) {
  ComponentRegistry.register(tagName, componentClass);
  
  if (!customElements.get(tagName)) {
    const CustomElementClass = createCustomElementClass(componentClass);
    customElements.define(tagName, CustomElementClass);
  }
} 