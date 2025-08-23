import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, Injector, Inject } from "@angular/core";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";

import { EVENT_BUS_LISTENER, NoteComponent } from "./note.component";

import { CoreService } from "./services/core.service";

import { BehaviorSubject, filter, Observable, take, tap } from "rxjs";
import { BusEvent, EVENT_BUS, EVENT_BUS_PUSHER, HOST_NAME } from "typlib";
import { createCustomElement } from "@angular/elements";
import { KeywordComponent } from './components/keyword/keyword.component';
import { DynamicSocketComponent } from "./components/_remote/dynamic-socket.component";
import { DynamicComponent } from "./components/_remote/dynamic/dynamic.component";
import { WebComponentWrapperComponent } from "./components/_remote/web-component-wrapper";


export const CHILD_ROUTES = [
  {
    path: '', 
    component: NoteComponent,
    children: [
      // {
      //   // path: '', component: WellComponent
      //   path: '', component: TicketDetailComponent
      // },
      // {
      //   path: 'ticket', component: TicketDetailComponent
      // },
      // { 
      //   path: 'ticket/:id', component: TicketDetailComponent
      // }, 
      // {
      //   path: 'ticket-create', component: TicketCreateComponent
      // },
      // { 
      //   path: 'ticket-list', component: TicketListComponent
      // }, 
      // { 
      //   path: 'answer-list/:id', component: AnswerListComponent
      // },
      // {
      //   path: 'schedule-create', component: ScheduleCreateComponent
      // },
      // {
      //   path: 'schedule-list', component: ScheduleListComponent
      // }
    ]
  }, 
]

@NgModule({
  declarations: [
    NoteComponent,
    KeywordComponent,
    DynamicSocketComponent,
    DynamicComponent,
    WebComponentWrapperComponent

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(CHILD_ROUTES),
    HttpClientModule,
  ],
  providers: [
    { 
      provide: 'WEB_VERSION', 
      useValue: process.env['NOTE_WEB_VERSION']
    },
    
    CoreService,
    
    { 
      provide: EVENT_BUS_LISTENER, 
      useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
        return eventBus$
          .asObservable()
          .pipe(
            filter((res: BusEvent) => {
              return res.to === `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`
            }),
            tap(res => {
              console.log('faq module saw event: ' + res.event)
            })
          );
      },
      deps: [EVENT_BUS], 
    },
    { 
      provide: 'ROUTER_PATH_DONE', 
      useFactory: (eventBus$: Observable<BusEvent>) => {
        return eventBus$
          .pipe(
            filter((res: BusEvent) => {
              return res.to === `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}` &&
                res.event === 'ROUTER_PATH'
            }),
            take(1)
          )
      },
      deps: [EVENT_BUS_LISTENER], 
    },
    { 
      provide: 'REGISTER_COMPONENTS_DONE',
      useFactory: (eventBus$: Observable<BusEvent>) => {
        return eventBus$
          .pipe(
            filter((res: BusEvent) => {
              return res.to === `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}` &&
                res.event === 'REGISTER_COMPONENTS_DONE'
            }),
            take(1)
          )
      },
      deps: [EVENT_BUS_LISTENER], 
    },
    {
      provide: EVENT_BUS_PUSHER,
      useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
        return (busEvent: BusEvent) => {
          eventBus$.next(busEvent);
        };
      },
      deps: [EVENT_BUS],
    },
  ],
  exports: [ 
    NoteComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class NoteModule {
  
  constructor(
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    @Inject('ROUTER_PATH_DONE')
    private readonly routerPathDone$: Observable<BusEvent>,
    
    @Inject(EVENT_BUS_PUSHER)
    private readonly eventBusPusher: (busEvent: BusEvent) => void,
    private _coreService: CoreService,
    
    private injector: Injector,
    @Inject('WEB_VERSION') private readonly webVersion: string,
    @Inject(HOST_NAME) private readonly hostName: string,
  ) {
    console.log('Note module constructor')
    
    this.eventBusListener$.subscribe((res: BusEvent) => {
      if (res.event === 'ROUTER_PATH') {
        this._coreService.setRouterPath((res.payload as any).routerPath).then(() => {
          // this._sendDoneEvent(res, 'self')
        })
      }
      if (res.event === 'REGISTER_COMPONENTS_DONE') {
        // this._registerComponentsService.setComponentsRegistered(true)
      }
    })
    this.routerPathDone$.subscribe(res => {
      console.log('ROUTER_PATH RECEIVED, START COMPONENTS REGISTER')
      // this._registerComponents()
    })

    this.eventBusPusher({
      from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
      to: this.hostName,
      event: 'ASK_ROUTER_PATH',
      payload: {
        projectId: `${process.env['PROJECT_ID']}`
      }
    })

  }
  ngDoBootstrap() {}
  
   

  private _sendDoneEvent(busEvent: BusEvent, to?: string): void {
    const doneBusEvent: BusEvent = {
      from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
      to: to === 'self' 
        ? `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`
        : `${busEvent.from}`,
      event: `${busEvent.event}_DONE`,
      payload: null
    }
    this.eventBusPusher(doneBusEvent)
  }
}


