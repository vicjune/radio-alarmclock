import { Component } from '@angular/core';
import { NavParams, ViewController } from 'ionic-angular';

import { Alarm } from '../../interfaces/alarm';

@Component({
  selector: 'page-alarm',
  templateUrl: 'alarm.html'
})
export class AlarmPage {
    alarm: Alarm;
    newAlarm: boolean;

    constructor(params: NavParams, public viewCtrl: ViewController) {
        if (params.get('alarm')) {
            this.alarm = params.get('alarm');
            this.alarm.enabled = true;
            this.newAlarm = false;
        } else {
            let now = new Date();
            this.alarm = {
                id : + now,
                days: [],
                hour: now.getHours(),
                minute: now.getMinutes(),
                enabled: true,
                loading: true
            }
            this.newAlarm = true;
        }
    }

    save(): void {
        this.viewCtrl.dismiss(this.alarm);
    }

    close(): void {
        this.viewCtrl.dismiss();
    }

    delete(): void {
        this.alarm.enabled = false;
        this.save();
    }

}
