import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs/Rx';
import { Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { BLE } from '@ionic-native/ble';

import { WebsocketService } from './websocket.service';
import { ErrorService } from './error.service';

@Injectable()
export class ConnectionService {
	ip: string;
	ipSubject: ReplaySubject<string> = new ReplaySubject<string>(1);
	scanRunning: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
	scanTimeout;
	websockets: WebSocket[];
	scanRun: boolean = false;

	constructor(
		platform: Platform,
		public websocketService: WebsocketService,
		public errorService: ErrorService,
		public storage: Storage,
		public ble: BLE
	) {
		platform.ready().then(() => {
			this.storage.get('ipAddress').then(data => {
				if (data) {
					this.firstConnect(data.value);
					this.ipSubject.next(data.value);
				} else {
					this.scan();
				}
			}).catch(err => {
				console.error(err);
				this.scan();
			});
		});
	}

	firstConnect(ip: string): void {
		this.storage.set('ipAddress', {
			value: ip
		}).catch(err => console.error(err));

		this.ipSubject.next(ip);
		this.ip = ip;
		this.connect();
	}

	connect(): void {
		if (this.ip) {
			this.websocketService.connect('ws://' + this.ip + ':8001/');
		}
	}

	scan(): void {
		if (!this.scanRun) {
			this.scanRun = true;
			this.scanRunning.next(true);
			this.websockets = [];
			this.scanTimeout = setTimeout(() => {
				this.cancelScan();
				this.errorService.display('Couln\'t find any device');
			}, 10000);

			try {
				for (let i = 0; i <= 1; i++) {
					for (let j = 0; j <= 255; j++) {
						let websocket = new WebSocket('ws://192.168.' + i + '.' + j + ':8001/');
						websocket.onopen = event => {
							this.cancelScan();
							this.firstConnect(this.ipExtension((event.currentTarget as WebSocket).url));
						};
						this.websockets.push(websocket);
					}
				}
			} catch (e) {
				console.error(e);
				this.cancelScan();
				this.errorService.display('An error occured during network scan');
			}
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

	scanBluetooth(): void {
		if (!this.scanRun) {
			this.ble.isEnabled().then(() => {
				let timeout = setTimeout(() => {
					this.ble.stopScan();
					this.scanRun = false;
					this.scanRunning.next(false);
					this.errorService.display('Couln\'t find any device');
				}, 10000);
				this.scanRun = true;
				this.scanRunning.next(true);
				this.ble.startScan([]).switchMap(device => {
					console.log('///////////');
					console.log(device);
					console.log('///////////');
					this.ble.stopScan();
					clearTimeout(timeout);
					// this.scanRun = false;
					// this.scanRunning.next(false);
					return this.ble.connect(device.id).switchMap(status => {
						return Observable.fromPromise(this.ble.read(device.id, 'ec00', 'ec01'));
					});
				}).subscribe(wifiNetworks => {
					console.log(this.fromBytes(wifiNetworks));
				});
			}).catch(() => {
				this.errorService.display('Bluetooth is disabled');
			});
		} else {
			this.cancelScanBluetooth();
		}
	}

	cancelScanBluetooth(): void {
		this.ble.stopScan();
		this.scanRun = false;
		this.scanRunning.next(false);
	}

	private ipExtension(ip: string): string {
		return ip.match(/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/)[0];
	}

	private toBytes(payload: any): ArrayBuffer {
		let jsonString = JSON.stringify(payload);
		var array = new Uint8Array(jsonString.length);
		for (var i = 0, l = jsonString.length; i < l; i++) {
			array[i] = jsonString.charCodeAt(i);
		}
		return array.buffer;
	}

	private fromBytes(buffer: ArrayBuffer): any {
		try {
			return JSON.parse(String.fromCharCode.apply(null, new Uint8Array(buffer)));
		} catch (err) {
			console.error(err);
			return null;
		}
	}
}
