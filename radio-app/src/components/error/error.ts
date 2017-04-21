import { Component, OnInit } from '@angular/core';

import { WebsocketService } from '../../services/websocket.service';
// import { errorStyle } from './error.scss';

@Component({
	selector: 'error',
	templateUrl: 'error.html'
})
export class ErrorComponent implements OnInit {
	online: boolean = true;
	displayed: boolean = false;
	timeout = null;

	constructor(public websocketService: WebsocketService) {}

	ngOnInit() {
		this.websocketService.getConnectionStatus().subscribe(status => {
			if (status === 1) {
				this.online = true;
				this.displayed = true;
				if (this.timeout) {
					clearTimeout(this.timeout);
				}
				this.timeout = setTimeout(() => {
					this.displayed = false;
					this.timeout = null;
				}, 2000);
			} else {
				if (this.online) {
					this.online = false;
					this.displayed = true;
					if (this.timeout) {
						clearTimeout(this.timeout);
					}
				}
			}
		});
	}

}
