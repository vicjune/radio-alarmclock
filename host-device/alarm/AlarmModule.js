"use strict";

module.exports = class AlarmModule {
	constructor(localStorage, radioModule, websocketServer) {
		this.durationTimeout = null;
		this.incrementalInterval = null;

		this.localStorage = localStorage;
		this.radioModule = radioModule;
		this.websocketServer = websocketServer;
	}

	startClock() {
		let preparationInterval = setInterval(() => {
			if (new Date().getSeconds() === 0) {
				clearInterval(preparationInterval);
				console.log('Clock started');

				setInterval(() => {
					let now = new Date();
					let triggerAlarms = false;
					let triggeredAlarm;
					for (let alarm of this.localStorage.alarms) {
						let triggerAlarm = (alarm.days.indexOf(now.getDay()) >= 0 || alarm.days.length === 0) && now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && alarm.enabled;
						triggerAlarms = triggerAlarms || triggerAlarm;
						triggeredAlarm = alarm;
						if (triggerAlarm && alarm.days.length === 0) {
							alarm.enabled = false;
							this.websocketServer.send('alarm', alarm);
						}
					}
					if (triggerAlarms) {
						this.localStorage.lastRadio = this.localStorage.getRadio(triggeredAlarm.radioId);
						this.startAlarm(true, this.localStorage.lastRadio.url);
					}
				}, 60000);
			}
		}, 100);
	}

	startAlarm(incremental, url) {
		if (this.durationTimeout) {
			clearTimeout(this.durationTimeout);
		}

		this.radioModule.startStream(url);
		console.log('Alarm started');

		if (incremental && this.localStorage.increment > 0) {
			this.radioModule.setVolume(0);
			let staticIncrement = this.localStorage.increment;
			let volume = 60;
			this.incrementalInterval = setInterval(() => {
				volume = volume + (100 - 60) / (staticIncrement * 60);
				if (volume <= 100 && this.localStorage.radioPlaying) {
					this.radioModule.setVolume(Math.floor(volume));
				} else {
					clearInterval(this.incrementalInterval);
					this.incrementalInterval = null;
				}
			}, 1000);
		} else {
			this.radioModule.setVolume(100);
			if (this.incrementalInterval) {
				clearInterval(this.incrementalInterval);
				this.incrementalInterval = null;
			}
		}

		if (this.localStorage.duration > 0 && this.localStorage.duration < 120) {
			this.durationTimeout = setTimeout(() => {
				this.stopAlarm();
			}, this.localStorage.duration * 60000);
		}
	}

	stopAlarm() {
		if (this.localStorage.radioPlaying) {
			if (this.incrementalInterval) {
				clearInterval(this.incrementalInterval);
				this.incrementalInterval = null;
			}
			clearTimeout(this.durationTimeout);
			this.radioModule.stopStream();
			console.log('Alarm stopped');
		}
	}
}
