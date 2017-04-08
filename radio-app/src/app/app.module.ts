import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { AlarmPage } from '../pages/alarm/alarm';
import { WebsocketService } from '../services/websocket.service';
import { FireService } from '../services/fire.service';
import { FrontZerosPipe } from '../pipes/front-zeros.pipe';

@NgModule({
	declarations: [
		MyApp,
		HomePage,
		SettingsPage,
		AlarmPage
	],
	imports: [
		IonicModule.forRoot(MyApp)
	],
	bootstrap: [IonicApp],
	entryComponents: [
		MyApp,
		HomePage,
		SettingsPage,
		AlarmPage
	],
	providers: [
		StatusBar,
		SplashScreen,
		WebsocketService,
		FireService,
		FrontZerosPipe,
		{provide: ErrorHandler, useClass: IonicErrorHandler}
	]
})
export class AppModule {}
