import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, Subject } from 'rxjs/Rx';

import { WebsocketService } from './websocket.service';

@Injectable()
export class FireService {
	private subjects: ReplaySubject<any>[] = [];

	constructor(
		public websocketService: WebsocketService
	) {
		websocketService.socket.subscribe(payload => {
			if (!this.subjects[payload.type]) {
				this.createSubject(payload.type);
			}
			this.subjects[payload.type].next(payload.data);
		});
	}

	bind(type: string): Observable<any> {
		if (!this.subjects[type]) {
			this.createSubject(type);
		}
		return this.subjects[type].asObservable();
	}

	send(type: string, data): void {
		this.websocketService.send({
			type: type,
			data: data
		});
	}

	private createSubject(type: string) {
		let subject;

		if (type === 'error') {
			subject = new Subject<string>();
		} else if (
			type === 'alarm' ||
			type === 'url'
		) {
			subject = new ReplaySubject<any>();
		} else if (
			type === 'version' ||
			type === 'playRadio' ||
			type === 'config' ||
			type === 'alarmList' ||
			type === 'radioList' ||
			type === 'defaultRadioId' ||
			type === 'updateAvailable' ||
			type === 'radioPlaying' ||
			type === 'volume'
		) {
			subject = new ReplaySubject<any>(1);
		} else {
			subject = new ReplaySubject<any>();
		}

		this.subjects[type] = subject;
	}
}
