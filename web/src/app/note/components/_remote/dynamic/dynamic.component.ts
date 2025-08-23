import { Component, Inject, Injector, Input, OnInit, Type, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-dynamic-component',
  template: '<ng-container #container />'
})
export class DynamicComponent implements OnInit {

  @ViewChild('container', { read: ViewContainerRef, static: true })
  public container!: ViewContainerRef;

  @Input() componentName!: string

  constructor(
    private readonly _injector: Injector,
    @Inject('components') private readonly _components: Record<string, Type<unknown>>[],
  ) {}

  ngOnInit(): void {
    const entry = this._components.find(item => item[this.componentName]);

    if (entry) {
      const component = entry[this.componentName];
      this.container.createComponent(component, { injector: this._injector });
    } else {
      // console.error(`${this.componentName} component not provided.`);
    }
  }
}
