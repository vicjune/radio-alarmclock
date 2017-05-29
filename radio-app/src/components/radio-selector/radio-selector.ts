import { Component, Input, Output, EventEmitter, SimpleChange, OnChanges } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { Subject } from 'rxjs/Subject';

import { RadiosPage } from '../../pages/radios/radios';
import { Radio } from '../../interfaces/radio';
import { RadioListService } from '../../services/radioList.service';

@Component({
	selector: 'radio-selector',
	templateUrl: 'radio-selector.html'
})
export class RadioSelectorComponent implements OnChanges {
	@Input() selectedRadioId: number;
	@Input() label: string;
	@Output() onRadioSelected = new EventEmitter<number>();
	selectedRadio: Radio = null;
	private subject = new Subject<number>();

	constructor(
		public modalCtrl: ModalController,
		public radioListService: RadioListService
	) {
		this.subject.mergeMap(selectedRadioId => this.radioListService.getRadio(selectedRadioId))
		.subscribe(serverSelectedRadio => {
			this.selectedRadio = serverSelectedRadio as Radio;
		});
	}

	ngOnChanges(changes: { [key: string]: SimpleChange }) {
	    if (changes.hasOwnProperty('selectedRadioId')) {
	        this.subject.next(changes['selectedRadioId'].currentValue);
	    }
	}

	goRadios(): void {
		this.modalCtrl.create(RadiosPage, {
			selectedRadioId: this.selectedRadioId,
			radioSelectedCallback: newRadioId => {
				this.onRadioSelected.emit(newRadioId);
			}
		}).present();
	}
}
