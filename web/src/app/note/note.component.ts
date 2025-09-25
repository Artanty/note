import { ChangeDetectionStrategy, Component, DestroyRef, inject, Inject, InjectionToken, Injector, isDevMode, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, combineLatest, filter, forkJoin, Observable, of, Subject, take, takeUntil, tap } from "rxjs";
import { BusEvent, EVENT_BUS, EVENT_BUS_LISTENER, EVENT_BUS_PUSHER } from "typlib";
import { Router } from "@angular/router";
import { FontInitializerService } from "./services/font-initializer.service";
import { buildUrl } from "./services/route-builder";
import { CoreService } from "./services/core.service";
import { ApiService, Keyword } from "./services/api.service";


// export const EVENT_BUS_LISTENER = new InjectionToken<Observable<BusEvent>>('');
// export const EVENT_BUS_PUSHER = new InjectionToken<
//   (busEvent: BusEvent) => void
// >('');

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrl: './note.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // providers: [
  //   {
  //     provide: EVENT_BUS_LISTENER,
  //     useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
  //       return eventBus$
  //         .asObservable()
  //         .pipe(filter((res) => res.to === `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`));
  //     },
  //     deps: [EVENT_BUS],
  //   },
  //   {
  //     provide: EVENT_BUS_PUSHER,
  //     useFactory: (eventBus$: BehaviorSubject<BusEvent>) => {
  //       return (busEvent: BusEvent) => {
  //         eventBus$.next(busEvent);
  //       };
  //     },
  //     deps: [EVENT_BUS],
  //   },
  // ],
})

export class NoteComponent implements OnInit, OnDestroy {
  public text = '23424'
  destroyed = new Subject<void>()
  constructor(
    private router: Router,
    @Inject(EVENT_BUS_LISTENER)
    private readonly eventBusListener$: Observable<BusEvent>,
    private _coreService: CoreService,
    // private _registerComponentsService: RegisterComponentsService,
    private fontInitializer: FontInitializerService,
    // private _openerService: OpenerService,
    @Inject(EVENT_BUS_PUSHER)
    private readonly eventBusPusher: (busEvent: BusEvent) => void,
    // private _ticketQueueService: TicketQueueService,
    @Inject('WEB_VERSION') private readonly webVersion: string,
    private readonly _apiService: ApiService
  ) {
    this.eventBusListener$.pipe(
      takeUntil(this.destroyed)
    ).subscribe((res: BusEvent) => {
      console.log('note.comp saw event: ' + res.event)
    })
  }
  
  ngOnInit(): void {
    this.router.navigateByUrl('/note/keyword-list')
    combineLatest([
      this._routerPathSet$(),
      // this._registerComponentsService.listenComponentsRegistered$().pipe(
      //   filter((res: boolean) => res === true)
      // )
    ]).pipe(
      takeUntil(this.destroyed)
    ).subscribe(() => {
      // this._renderComponents()
      // this._load()
    })
  }

  public label = 'keywords'
  public keywordsSelect = null
  public keywordsOptions: Keyword[] = []
  public onValueChange(data: any) {
    console.log(data)
  }

  private _load() {
    this._apiService.getUserKeywords().subscribe(res => {
      this.keywordsOptions = res
    })
  }
  private _routerPathSet$(): Observable<boolean> {
    if (this._coreService.isRouterPathSet() === true) {
      return of(true)
    }
    this.eventBusPusher({
      from: `${process.env['PROJECT_ID']}@${process.env['NAMESPACE']}`,
      to: `${process.env['PROJECT_ID']}@web-host`,
      event: 'ASK_ROUTER_PATH',
      payload: {
        projectId: `${process.env['PROJECT_ID']}`
      }
    })
    return this._coreService.listenRouterPathSet$.pipe(
      filter((res: boolean) => res === true),
      take(1),
      takeUntil(this.destroyed)
    )
  }

  ngOnDestroy(): void {
    console.log('note destroyed')
    this.destroyed.next();
    this.destroyed.complete();
  }
}


