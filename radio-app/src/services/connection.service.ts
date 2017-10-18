import { Injectable } from '@angular/core';
import { ReplaySubject, BehaviorSubject } from 'rxjs/Rx';
import { Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { BLE } from '@ionic-native/ble';

import { WebsocketService } from './websocket.service';
import { ErrorService } from './error.service';

declare let WifiWizard: any;

@Injectable()
export class ConnectionService {
	ip: string;
	ipSubject: ReplaySubject<string> = new ReplaySubject<string>(1);
	scanRunning: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	scanTimeout;
	websockets: WebSocket[];
	disconnecting: boolean = false;
	bluetoothDevice;
	connectionSubscription;
	characteristicSubscription;

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
				}
			}).catch(err => {
				console.error(err);
				this.errorService.display('Can\'t access local storage');
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

	// scan(): void {
	// 	if (!this.scanRunning.getValue()) {
	// 		this.scanRunning.next(true);
	// 		this.websockets = [];
	// 		this.scanTimeout = setTimeout(() => {
	// 			this.cancelScan();
	// 			this.errorService.display('Couln\'t find any device');
	// 		}, 10000);
	//
	// 		try {
	// 			for (let i = 0; i <= 1; i++) {
	// 				for (let j = 0; j <= 255; j++) {
	// 					let websocket = new WebSocket('ws://192.168.' + i + '.' + j + ':8001/');
	// 					websocket.onopen = event => {
	// 						this.cancelScan();
	// 						this.firstConnect(this.ipExtension((event.currentTarget as WebSocket).url));
	// 					};
	// 					this.websockets.push(websocket);
	// 				}
	// 			}
	// 		} catch (e) {
	// 			console.error(e);
	// 			this.cancelScan();
	// 			this.errorService.display('An error occured during network scan');
	// 		}
	// 	} else {
	// 		this.cancelScan();
	// 	}
	// }
	//
	// cancelScan(): void {
	// 	clearTimeout(this.scanTimeout);
	// 	this.scanRunning.next(false);
	// 	this.websockets.forEach(ws => {
	// 		ws.close();
	// 	});
	// }

	scanBluetooth(): Promise<{ssid: string, needInfos: boolean}> {
		return new Promise((resolve, reject) => {
			if (!this.scanRunning.getValue()) {
				this.ble.isEnabled().then(() => {
					this.scanRunning.next(true);

					this.scanTimeout = setTimeout(() => {
						this.disconnectBluetooth();
						this.errorService.display('Couln\'t find Mouton');
						reject();
					}, 10000);

					this.connectionSubscription = this.ble.startScan([
						'1720648C-11ED-4847-9F49-86E839B6C9BE'
					]).first().switchMap(device => {
						this.ble.stopScan();
						clearTimeout(this.scanTimeout);
						this.bluetoothDevice = device;
						return this.ble.connect(device.id);
					}).subscribe(() => {

						this.getWifiStatus().then(response => {
							resolve(response);
						}).catch(() => {
							this.disconnectBluetooth();
							reject();
						});

					}, () => {
						this.errorService.display('Bluetooth connection error');
						this.disconnectBluetooth();
						reject();
					});
				}).catch(() => {
					this.errorService.display('Bluetooth is disabled on your phone');
					reject();
				});
			} else {
				this.disconnectBluetooth();
				reject();
			}
		});
	}

	disconnectBluetooth(): void {
		if (!this.disconnecting) {
			this.disconnecting = true;
			if (this.scanTimeout) {
				clearTimeout(this.scanTimeout);
			}
			if (this.connectionSubscription) {
				this.connectionSubscription.unsubscribe();
			}
			if (this.characteristicSubscription) {
				this.characteristicSubscription.unsubscribe();
			}

			this.ble.stopScan();

			this.ble.isConnected(this.bluetoothDevice.id).then(() => {
				this.ble.stopNotification(
					this.bluetoothDevice.id,
					'4F5E0138-2439-4A16-8311-D4F1C500613B',
					'B2FEBA5A-CADB-493C-AD72-34170D046C3B'
				).then(() => {
					this.ble.disconnect(this.bluetoothDevice.id).then(() => {
						this.scanRunning.next(false);
						this.disconnecting = false;
					}).catch(() => {
						this.scanRunning.next(false);
						this.disconnecting = false;
					});
				}).catch(() => {
					this.ble.disconnect(this.bluetoothDevice.id).then(() => {
						this.scanRunning.next(false);
						this.disconnecting = false;
					}).catch(() => {
						this.scanRunning.next(false);
						this.disconnecting = false;
					});
				});
			}).catch(() => {
				this.scanRunning.next(false);
				this.disconnecting = false;
			});
		}
	}

	connectHostDeviceToWifi (ssid: string, infos): void {
		let wifiInfos = {
			ssid: ssid
		};

		for (let key in infos) {
			if (infos.hasOwnProperty(key) && infos[key].length > 0) {
				wifiInfos[key] = infos[key];
			}
		}

		if (infos.password) {
			this.ble.write(
				this.bluetoothDevice.id,
				'4F5E0138-2439-4A16-8311-D4F1C500613B',
				'B2FEBA5A-CADB-493C-AD72-34170D046C3B',
				this.toBytes(wifiInfos)
			).catch(() => {
				this.errorService.display('Couln\'t connect Mouton to wifi');
				this.disconnectBluetooth();
			});
		} else {
			this.errorService.display('You need to enter a password');
		}
	}

	private getWifiStatus(): Promise<{ssid: string, needInfos: boolean}> {
		return new Promise((resolve, reject) => {
			WifiWizard.getCurrentSSID(ssid => {
				this.characteristicSubscription = this.ble.startNotification(
					this.bluetoothDevice.id,
					'4F5E0138-2439-4A16-8311-D4F1C500613B',
					'B2FEBA5A-CADB-493C-AD72-34170D046C3B'
				).map(response => this.fromBytes(response)).subscribe(response => {
					console.log('/////////');
					console.log(response);
					console.log('/////////');

					if (!response.error) {
						resolve({
							ssid: ssid,
							needInfos: ssid !== response.ssid
						});

						if (response.ssid && response.ip && ssid === response.ssid) {
							this.disconnectBluetooth();
							this.firstConnect(response.ip);
						}
					} else {
						this.errorService.display(response.error);
						this.disconnectBluetooth();
					}
				}, () => {
					this.errorService.display('Bluetooth error: Subscription');
				});
			}, () => {
				this.errorService.display('Wifi is not connected on your phone');
				reject();
			});
		});
	}

	// private ipExtension(ip: string): string {
	// 	return ip.match(/(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/)[0];
	// }

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
