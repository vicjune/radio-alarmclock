import { Component } from '@angular/core';
import { NavController, ModalController, ToastController } from 'ionic-angular';

import { Alarm } from '../../interfaces/alarm';
import { AlarmPage } from '../alarm/alarm';
import { SettingsPage } from '../settings/settings';
import { FireService } from '../../services/fire.service';
import { WebsocketService } from '../../services/websocket.service';
import { GlobalizationService } from '../../services/globalization.service';
import { RadioListService } from '../../services/radioList.service';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {
	alarms: Alarm[] = [];
	radioPlaying: boolean = false;
	radioLoading: boolean = true;
	online: boolean = false;
	toastTimeout = null;
	radioPlatyingId: number;

	constructor(
		public navCtrl: NavController,
		public modalCtrl: ModalController,
		public toastCtrl: ToastController,
		public fireService: FireService,
		public websocketService: WebsocketService,
		public globalization: GlobalizationService,
		public radioListService: RadioListService
	) {
		this.fireService.bind('alarm').subscribe(serverAlarm => {
			if (serverAlarm.delete) {
				this.deleteAlarm(serverAlarm.id, false);
			} else {
				serverAlarm.loading = false;
				let tempDate = new Date();
				tempDate.setHours(serverAlarm.hour);
				tempDate.setMinutes(serverAlarm.minute);
				serverAlarm.date = tempDate;
				this.setAlarm(serverAlarm, false);
			}
		});

		this.fireService.bind('alarmList').subscribe(serverAlarmList => {
			this.updateAlarms(serverAlarmList);
		});

		this.fireService.bind('playRadio').subscribe(radioStatus => {
			this.radioPlaying = radioStatus.playing;
			this.radioLoading = radioStatus.loading;
		});

		this.fireService.bind('radioPlaying').subscribe(serverRadio => {
			this.radioPlatyingId = serverRadio.id;

			if (!this.toastTimeout) {
				this.toastCtrl.create({
					message: serverRadio.label,
					duration: 2000,
					dismissOnPageChange: true,
					cssClass: 'playingToast'
				}).present();

				this.toastTimeout = setTimeout(() => {
					this.toastTimeout = null;
				}, 2000);
			}
		});

		this.websocketService.status.subscribe(status => {
			if (status === 1) {
				this.online = true;
			} else {
				this.online = false;
			}
		});
	}

	updateAlarms(alarmList: any): void {
		for (let alarm of this.alarms) {
			let serverAlarmExists = false;
			for (let serverAlarm of alarmList) {
				if (alarm.id === serverAlarm.id) {
					serverAlarmExists = true;
					break;
				}
			}
			if (!serverAlarmExists) {
				this.deleteAlarm(alarm.id, false);
			}
		}

		for (let serverAlarm of alarmList) {
			serverAlarm.loading = false;
			let tempDate = new Date();
			tempDate.setHours(serverAlarm.hour);
			tempDate.setMinutes(serverAlarm.minute);
			serverAlarm.date = tempDate;
			this.setAlarm(serverAlarm, false);
		}
	}

	setAlarm(newAlarm: Alarm, send: boolean): void {
		let alarmExists = false;
		for (let alarm of this.alarms) {
			if (alarm.id === newAlarm.id) {
				alarm.days = newAlarm.days;
				alarm.date = newAlarm.date;
				alarm.enabled = newAlarm.enabled;
				alarm.loading = newAlarm.loading;
				alarm.radioId = newAlarm.radioId;
				alarmExists = true;
				break;
			}
		}
		if (!alarmExists) {
			this.alarms.push({
				id: newAlarm.id,
				days: newAlarm.days,
				date: newAlarm.date,
				enabled: newAlarm.enabled,
				loading: send,
				radioId: newAlarm.radioId
			});
		}

		this.alarms.sort((a, b) => {
			if (a.date.getHours() === b.date.getHours()) {
				return a.date.getMinutes() - b.date.getMinutes();
			} else {
				return a.date.getHours() - b.date.getHours();
			}
		});

		if (send) {
			this.fireService.send('alarm', {
				id: newAlarm.id,
				days: newAlarm.days,
				hour: newAlarm.date.getHours(),
				minute: newAlarm.date.getMinutes(),
				enabled: newAlarm.enabled,
				radioId: newAlarm.radioId
			});
		}
	}

	deleteAlarm(alarmId: number, send: boolean): void {
		for (let i = 0; i < this.alarms.length; ++i) {
			if (this.alarms[i].id === alarmId) {
				this.alarms.splice(i, 1);
				break;
			}
		}

		if (send) {
			this.fireService.send('alarm', {
				id: alarmId,
				delete: true
			});
		}
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
				if (modalAlarm.delete) {
					this.deleteAlarm(modalAlarm.id, true);
				} else {
					this.setAlarm(modalAlarm, true);
				}
			}
		});
		alarmModal.present();
	}

	toggleAlarm(alarm: Alarm): void {
		alarm.loading = true;
		this.setAlarm(alarm, true);
	}

	itemClicked(item) {
		if (!item.animate) {
			item.animate = true;
			setTimeout(() => {
				item.animate = false;
			}, 500);
		}
	}

	goSettings(): void {
		this.navCtrl.push(SettingsPage);
	}

	play(id: number = null): void {
		this.radioLoading = true;
		this.radioPlaying = !this.radioPlaying;
		this.fireService.send('playRadio', {
			radioPlaying: this.radioPlaying,
			radioId: id
		});
	}
}
