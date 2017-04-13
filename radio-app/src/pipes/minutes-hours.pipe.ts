import { Pipe, PipeTransform } from '@angular/core';

import { FrontZerosPipe } from './front-zeros.pipe';

@Pipe({name: 'minuteHours'})
export class MinutesHoursPipe implements PipeTransform {
	constructor(public frontZerosPipe: FrontZerosPipe) {}

	transform(value: number): string {
		if (value < 60) {
			return value + ' min';
		} else {
			if (value % 60 === 0) {
				return (value / 60) + 'h';
			} else {
				return Math.floor(value / 60) + 'h' + this.frontZerosPipe.transform(value % 60);
			}
		}
	}
}
