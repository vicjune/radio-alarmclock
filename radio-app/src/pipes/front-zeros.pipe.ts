import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'frontZeros'})
export class FrontZerosPipe implements PipeTransform {
	transform(value: number, length?: number): string {
		return new Array((length || 2) + 1 - (value + '').length).join('0') + value;
	}
}
