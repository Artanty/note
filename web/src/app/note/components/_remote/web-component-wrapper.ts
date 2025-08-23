// app2/src/app/components/web-component-wrapper.component.ts
import { Component, Input, ViewChild, ViewContainerRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { DynamicComponentService } from './dynamic-component.service';


@Component({
  selector: 'app-web-component-wrapper',
  template: `<div #container></div>`,
  // standalone: true
})
export class WebComponentWrapperComponent implements AfterViewInit, OnChanges {
  @Input() componentName!: string;
  @Input() inputs?: Record<string, any>;
  @Input() outputs?: Record<string, (event: any) => void>;
  
  @ViewChild('container', { read: ViewContainerRef, static: true })
  viewContainerRef!: ViewContainerRef;

  private element: HTMLElement | null = null;

  constructor(private dynamicComponentService: DynamicComponentService) {}

  ngAfterViewInit() {
    this.renderComponent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.element && (changes['inputs'] || changes['outputs'])) {
      this.updateComponent();
    }
  }

  private async renderComponent() {
    try {
      this.element = await this.dynamicComponentService.renderWebComponent(
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
    if (!this.element) return;

    // Update inputs
    if (this.inputs) {
      Object.keys(this.inputs).forEach(key => {
        (this.element as any)[key] = this.inputs![key];
      });
    }
  }
}