import { 
  Component, 
  Input, 
  ViewChild, 
  ViewContainerRef, 
  AfterViewInit, 
  OnChanges, 
  SimpleChanges,
  Injector,
  ComponentFactoryResolver,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { waitForWebComponent } from './gui.utils';
import { Observable, shareReplay, Subscription } from 'rxjs';

@Component({
  selector: 'app-web-component-wrapper',
  template: `<div #container></div>`,
  standalone: true,
  imports: [CommonModule]
})
export class WebComponentWrapperComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() componentName!: string;
  @Input() inputs?: Record<string, any>;
  @Input() outputs?: Record<string, (event: any) => void>;
  
  @ViewChild('container', { read: ViewContainerRef, static: true })
  viewContainerRef!: ViewContainerRef;

  private element: HTMLElement | null = null;
  private inputSubscriptions: Map<string, Subscription> = new Map();

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector
  ) {}

  ngAfterViewInit() {
    console.log('componentName: ' + this.componentName)
    this.renderComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes)
    if (this.element && (changes['inputs'] || changes['outputs'])) {
      this.updateComponent();
    }
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.inputSubscriptions.forEach(sub => sub.unsubscribe());
    this.inputSubscriptions.clear();
  }

  private async renderComponent() {
    try {
      this.element = await this.renderWebComponent(
        this.viewContainerRef,
        this.componentName,
        this.inputs,
        this.outputs
      );
    } catch (error) {
      console.error('Failed to render web component:', error);
    }
  }

  private updateComponent() {
    if (!this.element || !this.inputs) return;

    // Update inputs
    Object.keys(this.inputs).forEach(key => {
      const value = this.inputs![key];
      
      // Handle Observable inputs
      if (value instanceof Observable) {
        this.subscribeToInput(key, value);
      } else {
        // Handle regular inputs
        (this.element as any)[key] = value;
      }
    });
  }

  private subscribeToInput(key: string, observable: Observable<any>) {
    if (this.inputSubscriptions.has(key)) {
      this.inputSubscriptions.get(key)!.unsubscribe();
      this.inputSubscriptions.delete(key);
    }

    // Use setTimeout to ensure the element is ready
    setTimeout(() => {
      const sharedObservable = observable.pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );

      // Get immediate value if available
      let immediateValue: any;
      const tempSub = sharedObservable.subscribe(value => {
        immediateValue = value;
      });
      tempSub.unsubscribe();

      // Set immediate value if we got one
      if (immediateValue !== undefined && this.element) {
        (this.element as any)[key] = immediateValue;
        console.log(`Immediate value for ${key}:`, immediateValue);
      }

      // Subscribe for future updates
      const subscription = sharedObservable.subscribe(value => {
        if (this.element) {
          (this.element as any)[key] = value;
          console.log(`Updated ${key} to:`, value);
        }
      });

      this.inputSubscriptions.set(key, subscription);
    });
  }

  private isBehaviorSubject(observable: any): boolean {
    return observable && 
      typeof observable.getValue === 'function' &&
      typeof observable.next === 'function' &&
      typeof observable.subscribe === 'function';
  }

  // Method to render web component dynamically
  private async renderWebComponent(
    viewContainerRef: ViewContainerRef,
    tagName: string,
    inputs?: Record<string, any>,
    outputs?: Record<string, (event: any) => void>
  ): Promise<HTMLElement> {
    
    // Wait for web component to be registered
    await waitForWebComponent(tagName);
    
    // Clear the container
    viewContainerRef.clear();
    
    // Create the web component element
    const element = document.createElement(tagName);
    
    // Set input properties (including Observable subscriptions)
    if (inputs) {
      Object.keys(inputs).forEach(key => {
        const value = inputs[key];
        
        if (value instanceof Observable) {
          console.log('value instanceof Observable')
          this.subscribeToInput(key, value.pipe(shareReplay(1)));
        } else {
          (element as any)[key] = value;
        }
      });
    }
    
    // Subscribe to output events
    if (outputs) {
      this.addOutputListeners(element, outputs);
    }
    
    // Get the native element of the view container
    const containerElement = viewContainerRef.element.nativeElement;
    
    // Append the web component
    containerElement.appendChild(element);
    
    return element;
  }

  private addOutputListeners(
    element: HTMLElement, 
    outputs: Record<string, (event: any) => void>
  ) {
    Object.entries(outputs).forEach(([eventName, callback]) => {
      if (callback) {
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent;
          callback(customEvent.detail);
        };
        element.addEventListener(eventName, handler as EventListener);
      }
    });
  } 
}