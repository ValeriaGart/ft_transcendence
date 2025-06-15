type ComponentConstructor = new (props?: any) => any;

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
      this.component = new ComponentClass(props);
    }

    connectedCallback() {
      this.component.mount(this);
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