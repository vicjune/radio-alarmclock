import { Injectable } from '@angular/core';
import Rx from 'rxjs/Rx';

import { WebsocketService } from './websocket.service';

@Injectable()
export class FireService {
    constructor(public websocketService: WebsocketService) {}

    bind(type: string): Rx.Observable<any> {
        return Rx.Observable.create((obs: Rx.Observer<any>) => {
            this.websocketService.socket.subscribe(payload => {
                if (payload.type === type) {
                    obs.next(payload.data);
                }
            },
            error => {
                obs.error(error);
            });
        });
    }

    send(type: string, data): void {
        this.websocketService.send({
            type: type,
            data: data
        });
    }
}
