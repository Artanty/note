import { Component, Input, ElementRef, OnDestroy, OnInit } from '@angular/core';
// not used
@Component({
  selector: 'app-dynamic-socket',
  template: `<div #socketContainer></div>`
})
export class DynamicSocketComponent implements OnInit, OnDestroy {
  @Input() componentName!: string;
  @Input() componentProps: any = {};

  private componentInstance: any;

  constructor(private elementRef: ElementRef) {}

  async ngOnInit() {
    // await this.loadComponent();
  }

  ngOnDestroy() {
    this.destroyComponent();
  }

  private async loadComponent() {
    try {
      // Wait for component to be available
      await this.waitForComponent(this.componentName);

      // Create web component instance
      this.componentInstance = document.createElement(this.componentName);

      // Set properties
      Object.keys(this.componentProps).forEach(key => {
        this.componentInstance[key] = this.componentProps[key];
      });

      // Listen to events
      this.componentInstance.addEventListener('userSelected', (event: any) => {
        this.handleEvent('userSelected', event.detail);
      });

      // Append to socket
      this.elementRef.nativeElement.querySelector('#socketContainer')
        .appendChild(this.componentInstance);

    } catch (error) {
      console.error('Failed to load component:', error);
    }
  }

  private async waitForComponent(componentName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (customElements.get(componentName)) {
        resolve();
        return;
      }

      // Check every 100ms if component is registered
      const interval = setInterval(() => {
        if (customElements.get(componentName)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error(`Component ${componentName} not found`));
      }, 5000);
    });
  }

  private handleEvent(eventName: string, data: any) {
    // Handle events from web component
    console.log(`Event ${eventName}:`, data);
  }

  private destroyComponent() {
    if (this.componentInstance) {
      this.componentInstance.remove();
    }
  }
}