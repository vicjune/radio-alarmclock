import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
	selector: 'page-settings',
	templateUrl: 'settings.html'
})
export class SettingsPage {
	increment: number = 0;
	duration: number = 15;
	debounceTimeout = null;

	constructor(public navCtrl: NavController, public fireService: FireService, public websocketService: WebsocketService) {
		this.fireService.bind('config').subscribe(serverConfig => {
			this.duration = serverConfig.duration;
			this.increment = serverConfig.increment;
		});
	}

	setConfig() {
		this.debounce(500, () => {
			this.fireService.send('config', {
				duration: this.duration,
				increment: this.increment
			});
		});
	}

	private debounce(timer, fn) {
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
		}
		this.debounceTimeout = setTimeout(() => {
			fn();
		}, timer);
	}

}
