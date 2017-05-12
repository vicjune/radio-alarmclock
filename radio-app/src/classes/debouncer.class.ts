export class Debouncer {
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
