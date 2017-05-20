import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Platform } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';

import { WebsocketService } from './websocket.service';
import { ErrorService } from './error.service';

@Injectable()
export class ConnectionService {
	ipSubject: ReplaySubject<string> = new ReplaySubject<string>(1);
	scanRunning: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
	scanTimeout;
	websockets: WebSocket[];
	scanRun: boolean = false;

	constructor(
		platform: Platform,
		public websocketService: WebsocketService,
		public errorService: ErrorService,
		public nativeStorage: NativeStorage
	) {
		platform.ready().then(() => {
			this.nativeStorage.getItem('ipAddress').then(data => {
				this.connect(data.value);
				this.ipSubject.next(data.value);
			}).catch(err => console.error(err));
		});
	}

	connect(ip: string): void {
		this.nativeStorage.setItem('ipAddress', {
			value: ip
		}).catch(err => console.error(err));

		this.ipSubject.next(ip);

		if (ip) {
			this.websocketService.connect('ws://' + ip + ':8001/');
		}
	}

	scan(): void {
		if (!this.scanRun) {
			this.scanRun = true;
			this.scanRunning.next(true);
			this.websockets = [];
			for (let i = 0; i <= 255; i++) {
				let websocket = new WebSocket('ws://192.168.1.' + i + ':8001/');
				websocket.onopen = event => {
					this.cancelScan();
					this.connect(this.ipExtension((event.currentTarget as WebSocket).url));
				};
				this.websockets.push(websocket);
			}
			this.scanTimeout = setTimeout(() => {
				this.cancelScan();
				this.errorService.display('Couln\'t find any device');
			}, 10000);
		} else {
			this.cancelScan();
		}
	}

	cancelScan(): void {
		clearTimeout(this.scanTimeout);
		this.scanRun = false;
		this.scanRunning.next(false);
		this.websockets.forEach(ws => {
			ws.close();
		});
	}

	private ipExtension(ip: string): string {
		return ip.match(/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/)[0];
	}
}
