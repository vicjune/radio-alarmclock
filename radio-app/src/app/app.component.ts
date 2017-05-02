import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { WebsocketService } from '../services/websocket.service';
import { FireService } from '../services/fire.service';


@Component({
	templateUrl: 'app.html'
})
export class MyApp {
	rootPage: any = HomePage;
	version: number = 1;

	constructor(
		platform: Platform,
		statusBar: StatusBar,
		splashScreen: SplashScreen,
		websocketService: WebsocketService,
		fireService: FireService
	) {
		platform.ready().then(() => {

			websocketService.connect('ws://127.0.0.1:8001');

			fireService.bind('version').subscribe(serverVersion => {
				if (serverVersion < this.version) {
					console.log('Update server');
				} else if (serverVersion > this.version) {
					console.log('Update app');
				}
			});

			statusBar.styleDefault();
			splashScreen.hide();
		});
	}
}
