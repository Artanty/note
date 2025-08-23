// app2/src/app/services/dynamic-component.service.ts
import { Injectable, ViewContainerRef, ComponentFactoryResolver, Injector } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DynamicComponentService {
  
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  // Method to render web component dynamically
  async renderWebComponent(
    viewContainerRef: ViewContainerRef,
    tagName: string,
    inputs?: Record<string, any>,
    outputs?: Record<string, (event: any) => void>
  ): Promise<HTMLElement> {
    
    // Wait for web component to be registered
    await this.waitForWebComponent(tagName);
    
    // Clear the container
    viewContainerRef.clear();
    
    // Create the web component element
    const element = document.createElement(tagName);
    
    // Set input properties
    if (inputs) {
      Object.keys(inputs).forEach(key => {
        (element as any)[key] = inputs[key];
      });
    }
    
    // Subscribe to output events
    if (outputs) {
      // Object.keys(outputs).forEach(eventName => {
      //   element.addEventListener(eventName, (event: CustomEvent) => {
      //     outputs[eventName](event.detail);
      //   });
      // });
    }
    
    // Get the native element of the view container
    const containerElement = viewContainerRef.element.nativeElement;
    
    // Append the web component
    containerElement.appendChild(element);
    
    return element;
  }

  private waitForWebComponent(tagName: string, timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (customElements.get(tagName)) {
        resolve();
        return;
      }

      const interval = setInterval(() => {
        if (customElements.get(tagName)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        reject(new Error(`Web component ${tagName} not found`));
      }, timeout);
    });
  }
}