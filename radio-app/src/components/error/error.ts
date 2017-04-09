import { Component, OnInit } from '@angular/core';

import { WebsocketService } from '../../services/websocket.service';
// import { errorStyle } from './error.scss';

@Component({
	selector: 'error',
	templateUrl: 'error.html'
})
export class ErrorComponent implements OnInit {
	connected: boolean;
	message: string = '';
	timeout = null;

	constructor(public websocketService: WebsocketService) {}

	ngOnInit() {
		this.websocketService.getConnectionStatus().subscribe(status => {
			if (status < 2) {
				this.connected = true;
				this.message = 'Connected';
				if (this.timeout) {
					clearTimeout(this.timeout);
				}
				this.timeout = setTimeout(() => {
					this.message = '';
					this.timeout = null;
				}, 2000);
			} else {
				this.connected = false;
				this.message = 'Not connected';
				if (this.timeout) {
					clearTimeout(this.timeout);
				}
			}
		});
	}

}
