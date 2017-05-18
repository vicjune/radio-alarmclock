import { Injectable } from '@angular/core';

@Injectable()
export class DebouncerService {
	private timeout = null;

	debounce(fn: Function, timer: number = 0) {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
		this.timeout = setTimeout(() => {
			fn();
		}, timer);
	}
}
