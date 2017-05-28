"use strict";

let RadioClient = require('../radio/RadioClient.js');

module.exports = class LocalStorage {
	constructor(version) {
		this.version = version;
		this.radioPlaying = false;
		this.radioLoading = false;
		this.websocketServer = null;

		this.duration = null;
		this.increment = null;
		this.alarms = null;
		this.radios = null;
		this.defaultRadioId = null;
		this.lastRadio = null;


		// TEMP
		this.defaultRadioId = 0;
		this.radios = [
			{
				id: 0,
				label: 'France Info',
				url: 'http://chai5she.cdn.dvmr.fr/franceinfo-midfi.mp3',
				validationPending: false,
				valid: true
			},
			{
				id: 1,
				label: 'Fip',
				url: 'http://direct.fipradio.fr/live/fip-midfi.mp3',
				validationPending: false,
				valid: true
			}
		];
		this.alarms = [{
			id: 0,
			days: [1, 2, 3, 4, 5],
			hour: 8,
			minute: 30,
			enabled: true,
			radioId: 0
		},
		{
			id: 1,
			days: [],
			hour: 10,
			minute: 30,
			enabled: false,
			radioId: 1
		}];
		this.duration = 60;
		this.increment = 5;

		this.lastRadio = this.getRadio(this.defaultRadioId);
	}

	getRadio(id) {
		for (let radio of this.radios) {
			if (radio.id === id) {
				return radio;
			}
		}
	}

	createAlarm(alarm) {
		this.alarms.push(alarm);
	}

	editAlarm(alarm) {
		let alarmExists = false;

		for (let _alarm of this.alarms) {
			if (_alarm.id === alarm.id) {
				_alarm.days = alarm.days;
				_alarm.hour = alarm.hour;
				_alarm.minute = alarm.minute;
				_alarm.enabled = alarm.enabled;
				_alarm.radioId = alarm.radioId;
				alarmExists = true;
				break;
			}
		}

		if (!alarmExists) {
			this.createAlarm(alarm);
		}
	}

	deleteAlarm(id) {
		for (let i = 0; i < this.alarms.length; ++i) {
			if (this.alarms[i].id === id) {
				this.alarms.splice(i, 1);
				break;
			}
		}
	}

	createRadio(radio) {
		let newRadio = {
			id: radio.id,
			label: radio.label,
			url: radio.url,
			valid: false,
			validationPending: true
		};

		this.radios.push(newRadio);

		new RadioClient().testUrl(newRadio.url, (url, valid) => {
			if (newRadio.url === url) {
				newRadio.valid = valid;
				newRadio.validationPending = false;

				this.websocketServer.send('radioList', this.radios);
			}
		})
	}

	editRadio(radio) {
		let radioExists = false;

		for (let _radio of this.radios) {
			if (_radio.id === radio.id) {
				radioExists = true;
				_radio.label = radio.label;
				let urlChange = _radio.url !== radio.url;
				_radio.url = radio.url;

				if (urlChange) {
					_radio.validationPending = true;

					new RadioClient().testUrl(_radio.url, (url, valid) => {
						if (_radio.url === url) {
							_radio.valid = valid;
							_radio.validationPending = false;

							this.websocketServer.send('radioList', this.radios);
						}
					});
				}
				break;
			}
		}
		if (!radioExists) {
			this.createRadio(radio);
		}
	}

	deleteRadio(id) {
		for (let i = 0; i < this.radios.length; ++i) {
			if (this.radios[i].id === id) {
				let radioDeletedId = this.radios[i].id;
				this.radios.splice(i, 1);
				for (let alarm of this.alarms) {
					if (alarm.radioId === radioDeletedId) {
						alarm.radioId = this.radios[0].id;

						this.websocketServer.send('alarm', alarm);
					}
				}
				break;
			}
		}
	}
}
