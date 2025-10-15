import {
  Directive, ElementRef, Renderer2, ComponentFactoryResolver, 
  ViewContainerRef, Input, OnInit, OnDestroy, Injector, TemplateRef,
  ComponentRef, Optional,
  InjectionToken,
  Inject,
  ChangeDetectorRef
} from '@angular/core';
import { WebComponentWrapperComponent } from './web-component-wrapper';
import { Router } from '@angular/router';
import { BusEvent, EVENT_BUS, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER, HOST_NAME } from 'typlib';
import { BehaviorSubject, filter, Observable, skipWhile, take, takeUntil } from 'rxjs';
import { generateRandomId } from '../../../utilites/generateRandomId';
import { dd } from '../../../utilites/dd';

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
export class GuiDirective {
  @Input() inputs: any = {};
  @Input() outputs: any = {};
  
  private element!: FormHTMLElement;
  private customComponentRef: ComponentRef<any> | null = null;
  private placeholderViewRef: any = null;
  private busEventId: string = ''

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private componentFactoryResolver: ComponentFactoryResolver,
    private viewContainerRef: ViewContainerRef,
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
  ) {}

  async ngOnInit() {
    this.element = this.el.nativeElement;
    this.busEventId = generateRandomId()
    this.useRemoteResource('gui-directive')
  }

  /**
   * 'gui-direcitive'
   */
  async useRemoteResource(remoteResourceName: string) {
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
        busEventId: this.busEventId,
        //for debug:
        // tag: this.el.nativeElement.tagName,
        // typeAttr: this.el.nativeElement.getAttribute('type')
      },
    };
    this.eventBusPusher(busEvent);
  }
}