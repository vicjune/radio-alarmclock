import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { WebsocketService } from './websocket.service';
import { ErrorService } from './error.service';

@Injectable()
export class ConnectionService {
	ipSubject: ReplaySubject<string> = new ReplaySubject<string>(1);
	scanRunning: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

	constructor(
		public websocketService: WebsocketService,
		public errorService: ErrorService
	) {
		// get local storage then
		let ip = '127.0.0.1';
		this.connect(ip);
		this.ipSubject.next(ip);
	}

	connect(ip: string): void {
		// store in local storage
		this.ipSubject.next(ip);
		this.websocketService.connect('ws://' + ip + ':8001/');
	}

	scan(): void {
		this.scanRunning.next(true);
		// search then
		// this.ipSubject.next(ip);
		// this.connect(ip);
		setTimeout(() => {
			this.scanRunning.next(false);
		}, 2000);
	}
}
