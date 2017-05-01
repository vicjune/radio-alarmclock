import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';
import { DatePicker } from '@ionic-native/date-picker';


import { Alarm } from '../../interfaces/alarm';
import { FrontZerosPipe } from '../../pipes/front-zeros.pipe';
import { weekDays } from '../../constants/week-days';

@Component({
	selector: 'page-alarm',
	templateUrl: 'alarm.html'
})
export class AlarmPage {
	alarm: Alarm;
	newAlarm: boolean;
	weekDays = weekDays;

	constructor(
		params: NavParams,
		public viewCtrl: ViewController,
		public frontZerosPipe: FrontZerosPipe,
		public datePicker: DatePicker
	) {
		if (params.get('alarm')) {
			this.alarm = JSON.parse(JSON.stringify(params.get('alarm')));
			this.alarm.enabled = true;
			this.newAlarm = false;
		} else {
			let now = new Date();
			this.alarm = {
				id : + now,
				days: [],
				hour: now.getHours(),
				minute: now.getMinutes(),
				enabled: true,
				loading: true
			}
			this.newAlarm = true;
		}
	}

	selectHour(): void {
		this.datePicker.show({
			date: new Date(), //TODO alarm time
			mode: 'time',
			androidTheme: this.datePicker.ANDROID_THEMES.THEME_HOLO_LIGHT
		}).then(
			date => {
				this.alarm.hour = date.getHours();
				this.alarm.minute = date.getMinutes();
			},
			err => console.log('Error occurred while getting date: ', err)
		);
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
		this.alarm.enabled = false;
		this.save();
	}

}
