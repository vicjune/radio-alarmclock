import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

import { FireService } from './fire.service';

@Injectable()
export class ErrorService {
	lastMessage: string = '';
	timeout = null;
	duration: number = 3000;

	constructor(
		public fireService: FireService,
		public toastCtrl: ToastController
	) {
		this.fireService.bind('error').subscribe(error => {
			this.display(error);
		});
	}

	display(message: string): void {
		if (message !== this.lastMessage || !this.timeout) {
			this.lastMessage = message;
			this.toastCtrl.create({
				message: message,
				duration: this.duration
			}).present();
			this.timeout = setTimeout(() => this.timeout = null, this.duration);
		}
	}
}
