import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'frontZeros'})
export class FrontZerosPipe implements PipeTransform {
	transform(value: number, length: number = 2): string {
		return new Array(+length + 1 - (value + '').length).join('0') + value;
	}
}
