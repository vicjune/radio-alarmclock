import { Component } from '@angular/core';
import { ModalController, NavParams } from 'ionic-angular';

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
	selectedRadioId: number;
	onSelectCallback: Function;

	constructor(
		public navParams: NavParams,
		public modalCtrl: ModalController,
		public fireService: FireService,
		public websocketService: WebsocketService,
		public error: ErrorService
	) {
		this.selectedRadioId = navParams.get('selectedRadioId');
		this.onSelectCallback = navParams.get('radioSelectedCallback');

		this.fireService.bind('radioList').subscribe(serverRadioList => {
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
			this.setRadio(serverRadio, false);
		}
	}

	setRadio(newRadio: Radio, send: boolean): void {
		let radioExists = false;
		for (let radio of this.radios) {
			if (radio.id === newRadio.id) {
				radio.label = newRadio.label;
				radio.url = newRadio.url;
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
				loading: send,
				valid: newRadio.valid,
				validationPending: newRadio.validationPending
			});
		}

		this.radios.sort((a, b) => {
			let labelA = a.label.toLowerCase();
			let labelB = b.label.toLowerCase();
			if (labelA < labelB) {
				return -1;
			}
			if (labelA > labelB) {
				return 1;
			}
			return 0;
		});

		if (send) {
			this.fireService.send('radio', {
				id: newRadio.id,
				label: newRadio.label,
				url: newRadio.url
			});
		}
	}

	deleteRadio(radioId: number, send: boolean): void {
		if (this.radios.length > 1) {
			for (let i = 0; i < this.radios.length; ++i) {
				if (this.radios[i].id === radioId) {
					let deletedActive = this.radios[i].id === this.selectedRadioId;
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
		this.selectedRadioId = selectedRadio.id;
		this.onSelectCallback(selectedRadio.id);
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
