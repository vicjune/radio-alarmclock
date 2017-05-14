import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import Rx from 'rxjs/Rx';

import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';
import { RadioListService } from '../../services/radioList.service';
import { RadiosPage } from '../radios/radios';
import { Radio } from '../../interfaces/radio';
import { Debouncer } from '../../services/debouncer.service';

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

	constructor(
		public navCtrl: NavController,
		public fireService: FireService,
		public websocketService: WebsocketService,
		public radioListService: RadioListService
	) {
		this.fireService.bind('config').subscribe(serverConfig => {
			this.duration = serverConfig.duration;
			this.increment = serverConfig.increment;
		});

		this.fireService.bind('defaultRadioId').mergeMap(defaultRadioId => this.radioListService.getRadio(defaultRadioId)).subscribe(serverDefaultRadio => {
			this.defaultRadio = serverDefaultRadio as Radio;
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
