import { Component, OnInit } from '@angular/core';

import { WebsocketService } from '../../services/websocket.service';

@Component({
	selector: 'connection-status',
	templateUrl: 'connection-status.html'
})
export class ConnectionStatusComponent implements OnInit {
	online: boolean = true;
	displayed: boolean = false;
	timeout = null;

	constructor(public websocketService: WebsocketService) {}

	ngOnInit() {
		this.websocketService.status.subscribe(status => {
			if (status === 1) {
				if (!this.online) {
					this.online = true;
					this.displayed = true;
					if (this.timeout) {
						clearTimeout(this.timeout);
					}
					this.timeout = setTimeout(() => {
						this.displayed = false;
						this.timeout = null;
					}, 2000);
				}
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
