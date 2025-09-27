import {
  Directive, ElementRef, Renderer2, ComponentFactoryResolver, 
  ViewContainerRef, Input, OnInit, OnDestroy, Injector, TemplateRef,
  ComponentRef, Optional,
  InjectionToken,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import { ElementsMap, GuiService, isRemoteLoaded } from './gui.service';
import { WebComponentWrapperComponent } from './web-component-wrapper';
import { Router } from '@angular/router';
import { buildCustomElName } from './gui.utils';
import { BusEvent, EVENT_BUS, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER, HOST_NAME } from 'typlib';
import { BehaviorSubject, filter, Observable, skipWhile, take, takeUntil } from 'rxjs';
import { dd } from '../../../utilites/dd';
import { generateRandomId } from '../../../utilites/generateRandomId';

export const GUI_PLACEHOLDER_TEMPLATE = new InjectionToken<TemplateRef<any>>('GUI_PLACEHOLDER_TEMPLATE');
export type FormHTMLElement = HTMLElement & { type: string }

@Directive({
  selector: '[gui]',
  providers: [
    {
      provide: GUI_PLACEHOLDER_TEMPLATE,
      useValue: null
    }
  ],
  standalone: true,
})
export class GuiDirective implements OnInit, OnDestroy {
  @Input() inputs: any = {};
  @Input() outputs: any = {};
  
  private element: FormHTMLElement;
  private customComponentRef: ComponentRef<any> | null = null;
  private placeholderViewRef: any = null;
  private busEventId: string = ''

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
    private guiService: GuiService,
    private injector: Injector,
    private router: Router,
    @Optional() @Inject(GUI_PLACEHOLDER_TEMPLATE) 
    private injectedPlaceholderTemplate: TemplateRef<any> | null,
    private cdr: ChangeDetectorRef,
    @Inject(EVENT_BUS) readonly bus: BehaviorSubject<BusEvent>,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    @Inject(EVENT_BUS_PUSHER)
    private eventBusPusher: (busEvent: BusEvent) => void,
    @Inject(HOST_NAME) private readonly hostName: string,

  ) {
    this.element = this.el.nativeElement;
    this.busEventId = generateRandomId()
  }

  async ngOnInit() {
    // await this._findCustomElement()
    this.useRemoteResource('gui-directive')
  }

  /**
   * 'gui-direcitive'
   */
  async useRemoteResource(remoteResourceName: string) {
    //subscribe
    this.eventBusListener$.
      pipe(
        skipWhile(res => (res.event !== 'REMOTE_RESOURCE') || (res.payload.busEventId !== this.busEventId)),
        take(1)
      ).subscribe(async res => {
        if (res.payload.resource && typeof res.payload.resource === 'function') {
          const directiveClass = new res.payload.resource(
            this.el,
            this.renderer,
            this.componentFactoryResolver,
            this.viewContainerRef,
            this.injector,
            this.cdr,
            this.hostName,
            WebComponentWrapperComponent,
            this.inputs,
            this.outputs
          );
          await directiveClass._findCustomElement()
        }
      })
    
    
    //push
    const project = remoteResourceName.split('-')[0];
    const resourceName = remoteResourceName.split('-')[1];
    const busEvent: BusEvent = {
      from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
      to: this.hostName,
      event: 'ASK_REMOTE_RESOURCE',
      payload: {
        remoteName: project,
        resourceName: resourceName,
        busEventId: this.busEventId
      },
    };
    this.eventBusPusher(busEvent);
  }
  

  private async _findCustomElement() {
    try {
      const elementKey = buildCustomElName(this.element);
      const customElementName = await this.guiService.getCustomElement(elementKey);
      await this.replaceWithCustomComponent(customElementName);
    } catch (e: unknown) {
      const text = (e instanceof Error) ? e.message : e;
      this.showPlaceholder('Failed to load custom element. ' + text);
    }
  }

  private async replaceWithCustomComponent(customElementName: string): Promise<void> {
    try {
      this.hideElement();
      const factory = this.componentFactoryResolver.resolveComponentFactory(WebComponentWrapperComponent);
      this.customComponentRef = this.viewContainerRef.createComponent(factory, undefined, this.injector);
      
      const instance = this.customComponentRef.instance;
      instance.componentName = customElementName;
      instance.inputs = { ...this.inputs, type: this.inputs.type ?? this.element.type };
      instance.outputs = this.outputs;
      this.cdr.detectChanges()
    } catch {
      this.showPlaceholder('Failed to load custom component');
    }
  }

  private showPlaceholder(message: string) {
    this.hideElement();
    this.clearPlaceholder();

    // Use injected template if available
    const template = this.injectedPlaceholderTemplate;
    if (template) {
      this.placeholderViewRef = this.viewContainerRef.createEmbeddedView(template, {
        $implicit: message,
        retry: () => this.retryLoading(),
        element: this.element
      });
      return;
    }

    // Fallback: throw error or create minimal placeholder
    this.createMinimalPlaceholder(message);
  }

  private createMinimalPlaceholder(message: string) {
    const placeholderElement = this.renderer.createElement('div');
    this.renderer.setProperty(placeholderElement, 'textContent', `${message}`);
    this.renderer.setStyle(placeholderElement, 'color', 'red');
    this.renderer.setStyle(placeholderElement, 'border', '1px solid red');
    this.renderer.setStyle(placeholderElement, 'padding', '5px');
    this.renderer.insertBefore(this.element.parentNode, placeholderElement, this.element.nextSibling);
    
    this.placeholderViewRef = { element: placeholderElement };
  }

  private clearPlaceholder() {
    if (this.placeholderViewRef) {
      if (this.placeholderViewRef.destroy) {
        this.placeholderViewRef.destroy();
      } else if (this.placeholderViewRef.element && this.placeholderViewRef.element.parentNode) {
        this.renderer.removeChild(this.placeholderViewRef.element.parentNode, this.placeholderViewRef.element);
      }
      this.placeholderViewRef = null;
    }
  }

  private async retryLoading() {
    this.clearPlaceholder();
    
    await this._findCustomElement()
  }

  private hideElement() {
    this.renderer.setStyle(this.element, 'display', 'none');
    this.renderer.setAttribute(this.element, 'aria-hidden', 'true');
  }

  ngOnDestroy() {
    if (this.customComponentRef) {
      this.customComponentRef.destroy();
    }
    
    this.clearPlaceholder();
  }
}