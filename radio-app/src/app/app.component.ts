import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { WebsocketService } from '../services/websocket.service';


@Component({
	templateUrl: 'app.html'
})
export class MyApp {
	rootPage:any = HomePage;

	constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public websocketService: WebsocketService) {
		platform.ready().then(() => {

			this.websocketService.connect('ws://192.168.1.46:8001');

			statusBar.styleDefault();
			splashScreen.hide();
		});
	}
}
