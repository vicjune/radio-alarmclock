import { Injectable } from '@angular/core';
import Rx from 'rxjs/Rx';

import { WebsocketService } from './websocket.service';

@Injectable()
export class FireService {
	constructor(public websocketService: WebsocketService) {}

	bind(type: string): Rx.Subject<any> {
		let subject = new Rx.Subject();
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
