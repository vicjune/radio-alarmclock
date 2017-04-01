import { Injectable } from '@angular/core';
import Rx from 'rxjs/Rx';

@Injectable()
export class WebsocketService {
    private socket: Rx.Subject<MessageEvent>;
    private ws: WebSocket;
    private url: string;

    connect(url: string = ''): Rx.Subject<MessageEvent> {
        if (url !== '' && url !== this.url) {
            this.url = url;
            if(!this.socket) {
                this.socket = this.create(url);
            } else {
                this.ws.close();
                this.socket = this.create(url);
            }
        }
        if (this.socket) {
            return this.socket;
        } else {
            return this.error('No websocket connected');
        }
    }

    send(data): void {
        if (this.socket) {
            this.socket.next(data);
        } else {
            console.error('No websocket connected');
        }
    }

    private create(url: string): Rx.Subject<MessageEvent> {
        this.ws = new WebSocket(url);

        let observable = Rx.Observable.create((obs: Rx.Observer<MessageEvent>) => {
            this.ws.onmessage = obs.next.bind(obs);
            this.ws.onerror = obs.error.bind(obs);
            this.ws.onclose = obs.complete.bind(obs);
            return this.ws.close.bind(this.ws);
        });

        let observer = {
            next: (data: Object) => {
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(data));
                } else {
                    console.error('Websocket connection is closed');
                }
            }
        };

        return Rx.Subject.create(observer, observable);
    }

    private error(errorMsg: string): Rx.Subject<MessageEvent> {
        return Rx.Subject.create({}, Rx.Observable.create((obs: Rx.Observer<MessageEvent>) => {
            return obs.error(errorMsg);
        }));
    }
}
