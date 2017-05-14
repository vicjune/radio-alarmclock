import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

import { FireService } from '../../services/fire.service';
import { Radio } from '../../interfaces/radio';
import { Debouncer } from '../../services/debouncer.service';

@Component({
	selector: 'page-radio',
	templateUrl: 'radio.html'
})
export class RadioPage {
	radio: Radio;
	newRadio: boolean = true;
	debouncer: Debouncer = new Debouncer();

	constructor(
		params: NavParams,
		public viewCtrl: ViewController,
		public fireService: FireService
	) {
		let now = new Date();
		this.radio = {
			id : + now,
			label: '',
			url: '',
			valid: false,
			validationPending: false,
			loading: true
		}
		if (params.get('radio')) {
			this.radio.id = params.get('radio').id;
			this.radio.label = params.get('radio').label;
			this.radio.url = params.get('radio').url;
			this.radio.valid = params.get('radio').valid;
			this.radio.validationPending = params.get('radio').validationPending;
			this.newRadio = false;
		}

		this.fireService.bind('url').subscribe(valid => {
			this.radio.validationPending = false;
			this.radio.valid = valid;
		});
	}

	checkUrl(url: string): void {
		this.debouncer.debounce(() => {
			this.radio.validationPending = true;
			this.fireService.send('url', url);
		}, 300);
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
