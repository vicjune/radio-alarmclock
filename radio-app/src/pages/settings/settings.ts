import { Component } from '@angular/core';

import { NavController } from 'ionic-angular';

@Component({
	selector: 'page-settings',
	templateUrl: 'settings.html'
})
export class SettingsPage {
	increment: number = 0;
	duration: number = 15;

	constructor(public navCtrl: NavController) {

	}

	setIncrement() {

	}

	setDuration() {

	}

}
