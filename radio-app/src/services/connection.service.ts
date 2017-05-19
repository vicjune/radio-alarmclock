import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { WebsocketService } from './websocket.service';
import { ErrorService } from './error.service';

@Injectable()
export class ConnectionService {
	ipSubject: ReplaySubject<string> = new ReplaySubject<string>(1);
	previousIp: string;

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
		this.websocketService.connect('ws://' + ip + ':8001');
		this.websocketService.status.subscribe(status => {
			if (status === 3 && ip !== this.previousIp) {
				this.errorService.display('Couldn\'t connect to ' + ip);
			}
			this.previousIp = ip;
		});
	}

	scan(): void {
		// search then
		// this.ipSubject.next(ip);
		// this.connect(ip);
	}
}
