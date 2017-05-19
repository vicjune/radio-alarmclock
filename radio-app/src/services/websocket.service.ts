import { Injectable } from '@angular/core';
import Rx from 'rxjs/Rx';
import { ReplaySubject } from 'rxjs/ReplaySubject';

@Injectable()
export class WebsocketService {
	socket: ReplaySubject<any> = new ReplaySubject<any>();
	status: ReplaySubject<number> = new ReplaySubject<number>(1);
	private ws: WebSocket;
	private url: string;
	private reconnectTimeout;
	private subject: Rx.Subject<any> = new Rx.Subject();
	private offlinePayloads = [];

	constructor() {
		this.subject.subscribe(ws => {
			ws.onmessage = data => {
				this.socket.next(JSON.parse(data.data));
			}
			this.status.next(ws.readyState);
		});
	}

	send(data): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		} else {
			this.offlinePayloads.push(data);
		}
	}

	connect(url: string, bounceTimer: number = 3000): void {
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
		this.subject.next(this.ws);

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
		};

		this.ws.onclose = () => {
			this.subject.next(this.ws);
			if (!this.reconnectTimeout) {
				this.reconnectTimeout = setTimeout(() => {
					this.bounceConnect(bounceTimer);
					this.reconnectTimeout = null;
				}, bounceTimer);
			}
		};
	}
}
