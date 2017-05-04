import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

import { Radio } from '../../interfaces/radio';

@Component({
	selector: 'page-radio',
	templateUrl: 'radio.html'
})
export class RadioPage {
	radio: Radio;
	newRadio: boolean = true;

	constructor(
		params: NavParams,
		public viewCtrl: ViewController,
	) {
		let now = new Date();
		this.radio = {
			id : + now,
			label: '',
			url: '',
			active: false,
			valid: false,
			validationPending: false,
			loading: true
		}
		if (params.get('radio')) {
			this.radio.id = params.get('radio').id;
			this.radio.label = params.get('radio').label;
			this.radio.url = params.get('radio').url;
			this.radio.active = params.get('radio').active;
			this.radio.valid = params.get('radio').valid;
			this.radio.validationPending = params.get('radio').validationPending;
			this.newRadio = false;
		}
	}

	save(): void {
		this.viewCtrl.dismiss(this.radio);
	}

	close(): void {
		this.viewCtrl.dismiss();
	}

	delete(): void {
		this.viewCtrl.dismiss({
			id : this.radio.id,
			delete: true
		});
	}

}
