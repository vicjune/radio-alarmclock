import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { DatePicker } from '@ionic-native/date-picker';

import { Alarm } from '../../interfaces/alarm';
import { GlobalizationService } from '../../services/globalization.service';
import { FireService } from '../../services/fire.service';

@Component({
	selector: 'page-alarm',
	templateUrl: 'alarm.html'
})
export class AlarmPage {
	alarm: Alarm;
	newAlarm: boolean = true;
	radioSelected: boolean = false;
	weekDays = this.globalization.weekDays;

	constructor(
		params: NavParams,
		public viewCtrl: ViewController,
		public datePicker: DatePicker,
		public globalization: GlobalizationService,
		public fireService: FireService
	) {
		let now = new Date();
		this.alarm = {
			id : + now,
			days: [],
			date: now,
			enabled: true,
			loading: true,
			radioId: null
		}
		if (params.get('alarm')) {
			this.alarm.id = params.get('alarm').id;
			this.alarm.days = params.get('alarm').days;
			this.alarm.date = params.get('alarm').date;
			this.alarm.radioId = params.get('alarm').radioId;
			this.newAlarm = false;
		}

		this.fireService.bind('defaultRadioId').subscribe(serverRadioId => {
			if (this.newAlarm && !this.radioSelected) {
				this.alarm.radioId = serverRadioId;
			}
		});
	}

	selectHour(): void {
		this.datePicker.show({
			date: this.alarm.date,
			mode: 'time',
			is24Hour: this.globalization.timeFormat === 'HH:mm',
			locale: this.globalization.locale,
			androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
		}).then(date => {
			if (date) {
				this.alarm.date = date;
			}
		}).catch(err => console.log(err));
	}

	toggleDay(id) {
		if (this.alarm.days.indexOf(id) > -1) {
			this.alarm.days.splice(this.alarm.days.indexOf(id), 1);
		} else {
			this.alarm.days.push(id);
		}
	}

	save(): void {
		this.viewCtrl.dismiss(this.alarm);
	}

	close(): void {
		this.viewCtrl.dismiss();
	}

	delete(): void {
		this.viewCtrl.dismiss({
			id : this.alarm.id,
			delete: true
		});
	}

	radioSelect(newRadioId: number): void {
		this.radioSelected = true;
		this.alarm.radioId = newRadioId;
	}
}
