import { Component } from '@angular/core';
import { AlertController } from 'ionic-angular';

import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';
import { ConnectionService } from '../../services/connection.service';
import { DebouncerService } from '../../services/debouncer.service';

@Component({
	selector: 'page-settings',
	templateUrl: 'settings.html'
})
export class SettingsPage {
	increment: number = 0;
	duration: number = 15;
	ipAddress: string;
	online: boolean = false;
	connecting: boolean = false;
	hostUpdating: boolean = false;
	hostUpdated: boolean = false;
	defaultRadioId: number = null;
	debouncer: DebouncerService = new DebouncerService();

	constructor(
		public fireService: FireService,
		public websocketService: WebsocketService,
		public connectionService: ConnectionService,
		public alertCtrl: AlertController
	) {
		this.fireService.bind('config').subscribe(serverConfig => {
			this.duration = serverConfig.duration;
			this.increment = serverConfig.increment;
		});

		this.fireService.bind('defaultRadioId').subscribe(serverDefaultRadioId => {
			this.defaultRadioId = serverDefaultRadioId;
		});

		this.websocketService.status.subscribe(status => {
			if (status === 1) {
				this.online= true;
			} else {
				this.online = false;
			}
			if (status === 2) {
				this.connecting = true;
			} else {
				this.connecting = false;
			}
		});

		this.connectionService.ipSubject.subscribe(ipAddress => {
			this.ipAddress = ipAddress;
		});

		this.fireService.bind('version').subscribe(() => {
			if (this.hostUpdating) {
				this.hostUpdating = false;
				this.hostUpdated = true;
				setTimeout(() => {
					this.hostUpdated = false;
				}, 5000);
			}
		});
	}

	setConfig() {
		this.debouncer.debounce(() => {
			this.fireService.send('config', {
				duration: this.duration,
				increment: this.increment
			});
		}, 500);
	}

	radioSelected(newRadioId: number): void {
		this.fireService.send('defaultRadioId', newRadioId);
	}

	autoConnect() {
		this.connectionService.scan();
	}

	manualConnect() {
		let promptOptions = {
			title: 'Manual connection',
			message: 'Enter your device IP address',
			inputs: [
				{
					name: 'ip',
					placeholder: '192.168.1.2',
					value: this.ipAddress || ''
				},
			],
			buttons: [
				{
					text: 'Cancel',
					handler: () => {}
				},
				{
					text: 'Save',
					handler: data => {
						this.ipAddress = data.ip;
						this.connectionService.connect(this.ipAddress);
					}
				}
			]
		};

		if (this.ipAddress) {
			promptOptions.message = 'Enter your device IP address. Current IP address is ' + this.ipAddress;
		}
		this.alertCtrl.create(promptOptions).present();
	}

	updateHost() {
		this.hostUpdating = true;
		this.fireService.send('updateHost', null);
	}
}
