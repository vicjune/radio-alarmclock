import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

import { FireService } from './fire.service';

@Injectable()
export class RadioListService {
	constructor(
		public fireService: FireService
	) {}

	getRadio(id: number, property: string = null): Observable<any> {
		return this.fireService.bind('radioList').map(serverRadioList => {
			for (let radio of serverRadioList) {
				if (radio.id === id) {
					if (property && radio.hasOwnProperty(property)) {
						return radio[property];
					} else {
						return radio;
					}
				}
			}
		});
	}
}
