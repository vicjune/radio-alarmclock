import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import Rx from 'rxjs/Rx';

import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';
import { RadiosPage } from '../radios/radios';
import { Radio } from '../../interfaces/radio';
import { Debouncer } from '../../classes/debouncer.class';

@Component({
	selector: 'page-settings',
	templateUrl: 'settings.html'
})
export class SettingsPage {
	increment: number = 0;
	duration: number = 15;
	online: boolean = false;
	defaultRadio: Radio = null;
	debouncer: Debouncer = new Debouncer();

	constructor(public navCtrl: NavController, public fireService: FireService, public websocketService: WebsocketService) {
		this.fireService.bind('config').subscribe(serverConfig => {
			this.duration = serverConfig.duration;
			this.increment = serverConfig.increment;
		});

		Rx.Observable.combineLatest(
			this.fireService.bind('radioList'),
			this.fireService.bind('defaultRadioId'),
			(serverRadioList, defaultRadioId) => ({serverRadioList, defaultRadioId})
		).subscribe(data => {
			this.defaultRadio = null;
			for (let serverRadio of data.serverRadioList) {
			    if (serverRadio.id === data.defaultRadioId) {
					this.defaultRadio = serverRadio;
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
		this.debouncer.debounce(() => {
			console.log(this.increment);
			this.fireService.send('config', {
				duration: this.duration,
				increment: this.increment
			});
		}, 500);
	}

	goRadios(): void {
		this.navCtrl.push(RadiosPage, {
			defaultRadioId: this.defaultRadio.id,
			radioSelectedCallback: newRadioId => {
				this.fireService.send('defaultRadioId', newRadioId);
			}
		});
	}
}
