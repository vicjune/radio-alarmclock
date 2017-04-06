import { Injectable } from '@angular/core';
import Rx from 'rxjs/Rx';

@Injectable()
export class WebsocketService {
    socket: Rx.Observable<MessageEvent>;
    private ws: WebSocket;
    private url: string;
    private reconnectTimeout;
    private subject: Rx.Subject<any> = new Rx.Subject();
    private offlinePayloads = [];

    constructor() {
        this.socket = Rx.Observable.create((obs: Rx.Observer<MessageEvent>) => {
            this.subject.subscribe(ws => {
                ws.onmessage = data => {
                    obs.next(JSON.parse(data.data));
                }
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

        return Rx.Observable.create((obs: Rx.Observer<number>) => {
            this.subject.subscribe(ws => {
                obs.next(ws.readyState);
            });
        });
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.url = null;
    }

    private bounceConnect(bounceTimer) {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.subject.next(this.ws);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            for (let data of this.offlinePayloads) {
                this.ws.send(JSON.stringify(data));
            }
            this.offlinePayloads = [];
        }

        this.ws.onclose = () => {
            this.subject.next(this.ws);
            if (!this.reconnectTimeout) {
                this.reconnectTimeout = setTimeout(() => {
                    this.bounceConnect(bounceTimer);
                    this.reconnectTimeout = null;
                }, bounceTimer);
            }
        }
    }
}
