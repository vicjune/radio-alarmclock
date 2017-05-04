import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { DatePicker } from '@ionic-native/date-picker';
import { Globalization } from '@ionic-native/globalization';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';
import { AlarmPage } from '../pages/alarm/alarm';
import { RadiosPage } from '../pages/radios/radios';
import { RadioPage } from '../pages/radio/radio';
import { ConnectionStatusComponent } from '../components/connection-status/connection-status';
import { WebsocketService } from '../services/websocket.service';
import { FireService } from '../services/fire.service';
import { GlobalizationService } from '../services/globalization.service';
import { ErrorService } from '../services/error.service';
import { FrontZerosPipe } from '../pipes/front-zeros.pipe';
import { WeekDaysPipe } from '../pipes/week-days.pipe';
import { MinutesHoursPipe } from '../pipes/minutes-hours.pipe';

@NgModule({
	declarations: [
		MyApp,
		HomePage,
		SettingsPage,
		AlarmPage,
		RadiosPage,
		RadioPage,
		ConnectionStatusComponent,
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
		RadiosPage,
		RadioPage,
		ConnectionStatusComponent
	],
	providers: [
		StatusBar,
		SplashScreen,
		WebsocketService,
		FireService,
		GlobalizationService,
		ErrorService,
		FrontZerosPipe,
		DatePicker,
		Globalization,
		{provide: ErrorHandler, useClass: IonicErrorHandler}
	]
})
export class AppModule {}
