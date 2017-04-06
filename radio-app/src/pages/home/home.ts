import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';

import { Alarm } from '../../interfaces/alarm';
import { AlarmPage } from '../alarm/alarm';
import { SettingsPage } from '../settings/settings';
import { FireService } from '../../services/fire.service';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    alarms: Alarm[] = [];

    constructor(platform: Platform, public navCtrl: NavController, public modalCtrl: ModalController, public fireService: FireService) {
        platform.ready().then(() => {

            this.fireService.bind('alarm').subscribe(serverAlarm => {
                this.editAlarm(serverAlarm, false);
            });

        });
    }

    editAlarm(newAlarm, loading: boolean): void {
        let alarmExists = false;
        for (let alarm of this.alarms) {
            if (alarm.id === newAlarm.id) {
                alarm.days = newAlarm.days;
                alarm.hour = newAlarm.hour;
                alarm.minute = newAlarm.minute;
                alarm.enabled = newAlarm.enabled;
                alarm.loading = loading;
                alarmExists = true;
                break;
            }
        }
        if (!alarmExists) {
            this.alarms.push({
                id: newAlarm.id,
                days: newAlarm.days,
                hour: newAlarm.hour,
                minute: newAlarm.minute,
                enabled: newAlarm.enabled,
                loading: loading
            });
        }
    }

    onAlarmToggle(event: boolean, alarm: Alarm): void {
        alarm.enabled = event;
        this.editAlarm(alarm, true);
        this.fireService.send('alarm', {
            id: alarm.id,
            days: alarm.days,
            hour: alarm.hour,
            minute: alarm.minute,
            enabled: event
        });
    }

    alarmSelected(alarm: Alarm = null): void {
        let alarmModal;
        if (alarm) {
            if (!alarm.loading) {
                alarmModal = this.modalCtrl.create(AlarmPage, {alarm: alarm});
            }
        } else {
            alarmModal = this.modalCtrl.create(AlarmPage);
        }
        alarmModal.onDidDismiss(modalAlarm => {
            if (modalAlarm) {
                if (modalAlarm.enabled) {
                    this.editAlarm(modalAlarm, true);
                    this.fireService.send('alarm', {
                        id: modalAlarm.id,
                        days: modalAlarm.days,
                        hour: modalAlarm.hour,
                        minute: modalAlarm.minute,
                        enabled: modalAlarm.enabled
                    });
                } else {
                    // this.deleteAlarm(modalAlarm);
                }
            }
        });
        alarmModal.present();
    }

    goSettings(): void {
        this.navCtrl.push(SettingsPage);
    }

}
