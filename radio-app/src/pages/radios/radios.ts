import { Component } from '@angular/core';

import { Radio } from '../../interfaces/radio';
import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
	selector: 'page-radios',
	templateUrl: 'radios.html'
})
export class RadiosPage {
	radios: Radio[] = [];
	loading: boolean = false;

	constructor(
		public fireService: FireService,
		public websocketService: WebsocketService
	) {
		this.fireService.bind('radioList').subscribe(serverRadioList => {
			this.loading = false;
			this.updateRadios(serverRadioList);
		});
	}

	updateRadios(radioList: any): void {
		for (let radio of this.radios) {
			let serverAlarmExists = false;
			for (let serverAlarm of radioList) {
				if (radio.id === serverAlarm.id) {
					serverAlarmExists = true;
					break;
				}
			}
			if (!serverAlarmExists) {
				this.deleteRadio(radio.id, false);
			}
		}

		for (let serverRadio of radioList) {
			serverRadio.loading = false;
			this.setRadio(serverRadio, false);
		}
	}

	setRadio(newRadio: Radio, send: boolean): void {
		let radioExists = false;
		for (let radio of this.radios) {
			if (radio.id === newRadio.id) {
				radio.label = newRadio.label;
				radio.url = newRadio.url;
				radio.active = newRadio.active;
				radio.loading = newRadio.loading;
				radioExists = true;
				break;
			}
		}
		if (!radioExists) {
			this.radios.push({
				id: newRadio.id,
				label: newRadio.label,
				url: newRadio.url,
				active: newRadio.active,
				loading: send
			});
		}

		if (send) {
			this.fireService.send('radio', {
				id: newRadio.id,
				label: newRadio.label,
				url: newRadio.url,
				active: newRadio.active
			});
		}
	}

	deleteRadio(radioId: number, send: boolean): void {
		for (let i = 0; i < this.radios.length; ++i) {
			if (this.radios[i].id === radioId) {
				this.radios.splice(i, 1);
				break;
			}
		}

		if (send) {
			this.fireService.send('radio', {
				id: radioId,
				delete: true
			});
		}
	}

	selectRadio(selectedRadio: Radio) {
		for (let radio of this.radios) {
		    radio.active = false;
		}
		selectedRadio.active = true;
		this.loading = true;
		this.setRadio(selectedRadio, true);
	}
}
