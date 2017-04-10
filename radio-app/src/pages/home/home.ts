import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { ModalController } from 'ionic-angular';

import { Alarm } from '../../interfaces/alarm';
import { AlarmPage } from '../alarm/alarm';
import { SettingsPage } from '../settings/settings';
import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {
	alarms: Alarm[] = [];
	radioPlaying: boolean = false;
	radioLoading: boolean = true;

	constructor(platform: Platform, public navCtrl: NavController, public modalCtrl: ModalController, public fireService: FireService, public websocketService: WebsocketService) {
		platform.ready().then(() => {
			this.fireService.bind('alarm').subscribe(serverAlarm => {
				if (serverAlarm.delete) {
					this.deleteAlarm(serverAlarm.id);
				} else {
					this.setAlarm(serverAlarm, false);
				}
			});

			this.fireService.bind('playRadio').subscribe(radioStatus => {
				this.radioPlaying = radioStatus.playing;
				this.radioLoading = radioStatus.loading;
			});

			this.websocketService.getConnectionStatus().subscribe(status => {
				if (status === 1) {
					this.alarms = [];
				}
			});
		});
	}

	setAlarm(newAlarm, loading: boolean): void {
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

		this.alarms.sort((a, b) => {
			if (a.hour === b.hour) {
				return a.minute - b.minute;
			} else {
				return a.hour - b.hour;
			}
		});
	}

	deleteAlarm(alarmId: number): void {
		for (let i = 0; i < this.alarms.length; ++i) {
			if (this.alarms[i].id === alarmId) {
				this.alarms.splice(i, 1);
				break;
			}
		}
	}

	onAlarmToggle(event: boolean, alarm: Alarm): void {
		alarm.enabled = event;
		this.setAlarm(alarm, true);
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
			alarmModal = this.modalCtrl.create(AlarmPage, {alarm: alarm});
		} else {
			alarmModal = this.modalCtrl.create(AlarmPage);
		}
		alarmModal.onDidDismiss(modalAlarm => {
			if (modalAlarm) {
				if (modalAlarm.enabled) {
					this.setAlarm(modalAlarm, true);
					this.fireService.send('alarm', {
						id: modalAlarm.id,
						days: modalAlarm.days,
						hour: modalAlarm.hour,
						minute: modalAlarm.minute,
						enabled: modalAlarm.enabled
					});
				} else {
					this.deleteAlarm(modalAlarm.id);
					this.fireService.send('alarm', {
						id: modalAlarm.id,
						delete: true
					});
				}
			}
		});
		alarmModal.present();
	}

	goSettings(): void {
		this.navCtrl.push(SettingsPage);
	}

	play(): void {
		this.radioLoading = true;
		this.radioPlaying = !this.radioPlaying;
		this.fireService.send('playRadio', this.radioPlaying);
	}
}
