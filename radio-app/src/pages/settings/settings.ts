import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';
import { RadiosPage } from '../radios/radios';
import { Radio } from '../../interfaces/radio';

@Component({
	selector: 'page-settings',
	templateUrl: 'settings.html'
})
export class SettingsPage {
	increment: number = 0;
	duration: number = 15;
	debounceTimeout = null;
	online: boolean = false;
	activeRadio: Radio = null;

	constructor(public navCtrl: NavController, public fireService: FireService, public websocketService: WebsocketService) {
		this.fireService.bind('config').subscribe(serverConfig => {
			this.duration = serverConfig.duration;
			this.increment = serverConfig.increment;
		});

		this.fireService.bind('radioList').subscribe(serverRadioList => {
			this.activeRadio = null;
			for (let serverRadio of serverRadioList) {
			    if (serverRadio.active) {
					this.activeRadio = serverRadio;
					break;
				}
			}
		});

		this.websocketService.status.subscribe(status => {
			if (status === 1) {
				this.online= true;
			} else {
				this.online = false;
			}
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

	goRadios(): void {
		this.navCtrl.push(RadiosPage);
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
