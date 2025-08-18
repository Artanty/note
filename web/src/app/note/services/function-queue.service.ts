import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class FunctionQueueService implements OnDestroy {
    private destroy$ = new Subject<void>();

    private functionQueue: {
        fn: Function;
        context?: any;
        props?: any;
        trigger$?: BehaviorSubject<boolean>;
        queueItemId: string
    }[] = [];

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    addToQueue(fn: Function, context?: any, props?: any, trigger$?: BehaviorSubject<boolean>) {
        const queueItemId = Date.now().toString() + Math.random()
        this.functionQueue.push({ fn, context, props, trigger$, queueItemId });
        
        if (trigger$) {
            if (trigger$.getValue() === true) {
                
                fn.call(context, props);
                this.deleteQueueItem(queueItemId)
            } else {
                trigger$
                    .pipe(
                        takeUntil(this.destroy$),
                        filter((el: any) => el === true)
                    )
                    .subscribe(() => {
                        fn.call(context, props);
                        this.deleteQueueItem(queueItemId)
                    });
            }
            
        }
    }

    deleteQueueItem(queueItemId: string): void {
        const found = this.functionQueue.find(el => el.queueItemId === queueItemId)
        if (found) {
            found.context = undefined
        }
        this.functionQueue.filter(el => el.queueItemId !== queueItemId)
    }
}