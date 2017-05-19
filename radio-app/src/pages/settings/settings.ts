import { Component } from '@angular/core';

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
	defaultRadioId: number = null;
	debouncer: DebouncerService = new DebouncerService();

	constructor(
		public fireService: FireService,
		public websocketService: WebsocketService,
		public connectionService: ConnectionService
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
		});

		this.connectionService.ipSubject.subscribe(ipAddress => {
			this.ipAddress = ipAddress;
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

	setIpAddress() {
		this.debouncer.debounce(() => {
			this.connectionService.connect(this.ipAddress);
		}, 1000);
	}

	scan() {
		this.connectionService.scan();
	}
}
