import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { AlarmPage } from '../pages/alarm/alarm';
import { ErrorComponent } from '../components/error/error';
import { WebsocketService } from '../services/websocket.service';
import { FireService } from '../services/fire.service';
import { FrontZerosPipe } from '../pipes/front-zeros.pipe';
import { WeekDaysPipe } from '../pipes/week-days.pipe';
import { MinutesHoursPipe } from '../pipes/minutes-hours.pipe';

@NgModule({
	declarations: [
		MyApp,
		HomePage,
		SettingsPage,
		AlarmPage,
		ErrorComponent,
		FrontZerosPipe,
		WeekDaysPipe,
		MinutesHoursPipe
	],
	imports: [
		IonicModule.forRoot(MyApp)
	],
	bootstrap: [IonicApp],
	entryComponents: [
		MyApp,
		HomePage,
		SettingsPage,
		AlarmPage,
		ErrorComponent
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
