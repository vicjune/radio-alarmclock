import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Globalization } from '@ionic-native/globalization';

import { weekDays } from '../constants/week-days';

@Injectable()
export class GlobalizationService {
	timeFormat: string = 'h:mm a';
	locale: string = 'en-US';
	weekDays = weekDays;

	constructor(
		globalization: Globalization,
		platform: Platform
	) {
		platform.ready().then(() => {
			globalization.getDatePattern({
				formatLength: '',
				selector: 'time'
			}).then(res => {
				this.timeFormat = res.pattern;
			}).catch(err => console.log(err));

			globalization.getLocaleName().then(res => {
				this.locale = res.value;
			}).catch(err => console.log(err));

			globalization.getFirstDayOfWeek().then(res => {
				for (let i = 0; i < Math.min(parseInt(res.value), 1); i++) {
					this.weekDays.push(this.weekDays.splice(0, 1)[0]);
				}
			}).catch(err => console.log(err));
		});
	}
}
