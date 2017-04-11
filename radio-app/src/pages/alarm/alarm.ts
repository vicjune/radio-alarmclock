import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

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
	hour: string;
	weekDays = weekDays;

	constructor(params: NavParams, public viewCtrl: ViewController, public frontZerosPipe: FrontZerosPipe) {
		if (params.get('alarm')) {
			this.alarm = JSON.parse(JSON.stringify(params.get('alarm')));
			this.alarm.enabled = true;
			this.newAlarm = false;
			this.hour = this.frontZerosPipe.transform(this.alarm.hour) + ':' + this.frontZerosPipe.transform(this.alarm.minute);
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
			this.hour = this.frontZerosPipe.transform(now.getHours()) + ':' + this.frontZerosPipe.transform(now.getMinutes());
		}
	}

	setHour(): void {
		this.alarm.hour = parseInt(this.hour.split(':')[0]);
		this.alarm.minute = parseInt(this.hour.split(':')[1]);
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
