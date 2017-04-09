import { Pipe, PipeTransform } from '@angular/core';

import { weekDays } from '../constants/week-days';

@Pipe({name: 'weekDays'})
export class WeekDaysPipe implements PipeTransform {
	transform(days: number[], displayNever: boolean): string {
		if (days.indexOf(0) > -1 && days.indexOf(1) === -1 && days.indexOf(2) === -1 && days.indexOf(3) === -1 && days.indexOf(4) === -1 && days.indexOf(5) === -1 && days.indexOf(6) > -1) {
			return 'The weekends';
		} else if (days.indexOf(0) === -1 && days.indexOf(1) > -1 && days.indexOf(2) > -1 && days.indexOf(3) > -1 && days.indexOf(4) > -1 && days.indexOf(5) > -1 && days.indexOf(6) === -1) {
			return 'During the week';
		} else {
			let output = '';
			for (let day of weekDays) {
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
