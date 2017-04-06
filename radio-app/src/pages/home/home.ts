import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { NavController } from 'ionic-angular';

import { Alarm } from '../../interfaces/alarm';
import { AlarmPage } from '../alarm/alarm';
import { FireService } from '../../services/fire.service';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    alarms: Alarm[] = [];

    constructor(platform: Platform, public navCtrl: NavController, public fireService: FireService) {
        platform.ready().then(() => {

            this.fireService.bind('alarm').subscribe(serverAlarm => {
                let alarmExists = false;
                for (let alarm of this.alarms) {
                    if (alarm.id === serverAlarm.id) {
                        alarm.days = serverAlarm.days;
                        alarm.hour = serverAlarm.hour;
                        alarm.minute = serverAlarm.minute;
                        alarm.enabled = serverAlarm.enabled;
                        alarm.loading = false;
                        alarmExists = true;
                        break;
                    }
                }
                if (!alarmExists) {
                    this.alarms.push({
                        id: serverAlarm.id,
                        days: serverAlarm.days,
                        hour: serverAlarm.hour,
                        minute: serverAlarm.minute,
                        enabled: serverAlarm.enabled,
                        loading: false
                    });
                }
            }, error => {
                console.log(error);
            });

        });
    }

    onAlarmToggle(event: boolean, id: number) {
        for (let i = 0; i < this.alarms.length; ++i) {
            if (this.alarms[i].id === id) {
                this.fireService.send('alarm', {
                    id: id,
                    days: this.alarms[i].days,
                    hour: this.alarms[i].hour,
                    minute: this.alarms[i].minute,
                    enabled: event
                });
                this.alarms[i].enabled = event;
                this.alarms[i].loading = true;
                break;
            }
        }
    }

    alarmSelected(alarm: Alarm = null) {
        if (alarm) {
            if (!alarm.loading) {
                this.navCtrl.push(AlarmPage); // + alarm parametter
            }
        } else {
            this.navCtrl.push(AlarmPage);
        }
    }

}
