import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import { WebsocketService } from './websocket.service';

@Injectable()
export class FireService {
	constructor(public websocketService: WebsocketService) {}

	bind(type: string): ReplaySubject<any> {
		let subject = new ReplaySubject<any>();
		this.websocketService.socket.subscribe(payload => {
			if (payload.type === type) {
				subject.next(payload.data);
			}
		});
		return subject;
	}

	send(type: string, data): void {
		this.websocketService.send({
			type: type,
			data: data
		});
	}
}
