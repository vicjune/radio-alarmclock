import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { FireService } from '../services/fire.service';
import { ErrorService } from '../services/error.service';
import { ConnectionService } from '../services/connection.service';


@Component({
	templateUrl: 'app.html'
})
export class MyApp {
	rootPage: any = HomePage;
	version: number = 2;

	constructor(
		platform: Platform,
		statusBar: StatusBar,
		splashScreen: SplashScreen,
		fireService: FireService,
		errorService: ErrorService,
		connectionService: ConnectionService
	) {
		platform.ready().then(() => {
			fireService.bind('version').subscribe(serverVersion => {
				if (serverVersion < this.version) {
					console.log('Update server');
				} else if (serverVersion > this.version) {
					console.log('Update app');
				}
			});

			statusBar.styleLightContent();
			statusBar.overlaysWebView(false);
			statusBar.backgroundColorByHexString('#e07d00');

			splashScreen.hide();
		});

		platform.resume.subscribe(() => {
			connectionService.connect();
		});
	}
}
