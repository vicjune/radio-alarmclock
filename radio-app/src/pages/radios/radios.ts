import { Component } from '@angular/core';
import { ModalController } from 'ionic-angular';

import { Radio } from '../../interfaces/radio';
import { RadioPage } from '../radio/radio';
import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';
import { ErrorService } from '../../services/error.service';

@Component({
	selector: 'page-radios',
	templateUrl: 'radios.html'
})
export class RadiosPage {
	radios: Radio[] = [];
	loading: boolean = false;

	constructor(
		public modalCtrl: ModalController,
		public fireService: FireService,
		public websocketService: WebsocketService,
		public error: ErrorService
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
				radio.valid = newRadio.valid;
				radio.validationPending = newRadio.validationPending;
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
				loading: send,
				valid: newRadio.valid,
				validationPending: newRadio.validationPending
			});
		}

		this.radios.sort((a, b) => a.id - b.id);

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
		if (this.radios.length > 1) {
			for (let i = 0; i < this.radios.length; ++i) {
				if (this.radios[i].id === radioId) {
					let deletedActive = this.radios[i].active;
					this.radios.splice(i, 1);
					if (deletedActive) {
						this.selectRadio(this.radios[0]);
					}
					break;
				}
			}

			if (send) {
				this.fireService.send('radio', {
					id: radioId,
					delete: true
				});
			}
		} else {
			this.error.display('You can\'t delete the last radio');
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

	editRadio(radio: Radio = null): void {
		let radioModal;
		if (radio) {
			radioModal = this.modalCtrl.create(RadioPage, {radio: radio});
		} else {
			radioModal = this.modalCtrl.create(RadioPage);
		}
		radioModal.onDidDismiss(modalRadio => {
			if (modalRadio) {
				if (modalRadio.delete) {
					this.deleteRadio(modalRadio.id, true);
				} else {
					this.setRadio(modalRadio, true);
				}
			}
		});
		radioModal.present();
	}
}
