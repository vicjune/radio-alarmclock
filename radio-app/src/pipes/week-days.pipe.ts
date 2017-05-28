import { Pipe, PipeTransform } from '@angular/core';

import { GlobalizationService } from '../services/globalization.service';

@Pipe({name: 'weekDays'})
export class WeekDaysPipe implements PipeTransform {
	constructor(public globalization: GlobalizationService) {}

	transform(days: number[], displayNever: boolean): string {
		if (
			days.indexOf(0) > -1 &&
			days.indexOf(1) === -1 &&
			days.indexOf(2) === -1 &&
			days.indexOf(3) === -1 &&
			days.indexOf(4) === -1 &&
			days.indexOf(5) === -1 &&
			days.indexOf(6) > -1) {
			return 'The weekends';
		} else if (
			days.indexOf(0) === -1 &&
			days.indexOf(1) > -1 &&
			days.indexOf(2) > -1 &&
			days.indexOf(3) > -1 &&
			days.indexOf(4) > -1 &&
			days.indexOf(5) > -1 &&
			days.indexOf(6) === -1) {
			return 'During the week';
		} else if (
			days.indexOf(0) > -1 &&
			days.indexOf(1) > -1 &&
			days.indexOf(2) > -1 &&
			days.indexOf(3) > -1 &&
			days.indexOf(4) > -1 &&
			days.indexOf(5) > -1 &&
			days.indexOf(6) > -1) {
			return 'Every days';
		} else {
			let output = '';
			for (let day of this.globalization.weekDays) {
				if (days.indexOf(day.id) > -1) {
					output += ' ' + day.short;
				}
			}
			if (output === '' && displayNever) {
				return 'Never';
			} else {
				return output;
			}
		}
	}
}
