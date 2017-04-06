import { Injectable } from '@angular/core';
import Rx from 'rxjs/Rx';

@Injectable()
export class WebsocketService {
    socket: Rx.Observable<MessageEvent>;
    private ws: WebSocket;
    private url: string;
    private reconnectTimeout;
    private subject: Rx.Subject<null> = new Rx.Subject();
    private offlinePayloads = [];

    constructor() {
        this.socket = Rx.Observable.create((obs: Rx.Observer<MessageEvent>) => {
            this.subject.subscribe(() => {
                this.ws.onmessage = data => {
                    obs.next(JSON.parse(data.data));
                };
                this.ws.onerror = event => {
                    obs.error('Websocket error');
                };
            });
        });
    }

    send(data): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.offlinePayloads.push(data);
        }
    }

    connect(url: string, bounceTimer: number = 3000) {
        if (url !== this.url) {
            if (this.ws) {
                this.ws.close();
            }
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            this.url = url;
            this.bounceConnect(bounceTimer);
        }
    }

    private bounceConnect(bounceTimer) {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            this.subject.next();
            for (let data of this.offlinePayloads) {
                this.ws.send(JSON.stringify(data));
            }
            this.offlinePayloads = [];
        }

        this.ws.onclose = () => {
            if (!this.reconnectTimeout) {
                this.reconnectTimeout = setTimeout(() => {
                    this.bounceConnect(bounceTimer);
                    this.reconnectTimeout = null;
                }, bounceTimer);
            }
        }
    }
}
