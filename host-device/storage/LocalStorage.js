"use strict";

let RadioClient = require('../radio/RadioClient.js');
let Storage = require('node-storage');

module.exports = class LocalStorage {
	constructor(version) {
		this.version = version;
		this.radioPlaying = false;
		this.radioLoading = false;

		this._updateAvailable = false;

		this.websocketServer = null;

		this.storage = new Storage('./storage/stored.storage');

		this.radios = this.storage.get('radios') || [
			{
				id: 1,
				label: 'France Info',
				url: 'http://chai5she.cdn.dvmr.fr/franceinfo-midfi.mp3',
				validationPending: false,
				valid: true
			},
			{
				id: 2,
				label: 'Fip',
				url: 'http://direct.fipradio.fr/live/fip-midfi.mp3',
				validationPending: false,
				valid: true
			}
		];
		this.alarms = this.storage.get('alarms') || [];

		this._defaultRadioId = this.storage.get('defaultRadioId') || 1;
		this._duration = this.storage.get('duration') || 60;
		this._increment = this.storage.get('increment') || 5;
		this._lastRadio = this.storage.get('lastRadio') || this.getRadio(this._defaultRadioId);

		for (let radio of this.radios) {
			if (radio.validationPending) {
				radio.validationPending = false;
				radio.valid = false;
			}
		}
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

		this.storage.put('alarms', this.alarms);
	}

	deleteAlarm(id) {
		for (let i = 0; i < this.alarms.length; ++i) {
			if (this.alarms[i].id === id) {
				this.alarms.splice(i, 1);
				break;
			}
		}

		this.storage.put('alarms', this.alarms);
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
				this.storage.put('radios', this.radios);
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
							this.storage.put('radios', this.radios);
						}
					});
				}
				break;
			}
		}
		if (!radioExists) {
			this.createRadio(radio);
		}

		this.storage.put('radios', this.radios);
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
						this.storage.put('alarms', this.alarms);
					}
				}
				break;
			}
		}

		this.storage.put('radios', this.radios);
	}

	set defaultRadioId(id) {
		this._defaultRadioId = id;
		this.storage.put('defaultRadioId', this._defaultRadioId);
	}

	get defaultRadioId() {
		return this._defaultRadioId;
	}

	set duration(duration) {
		this._duration = duration;
		this.storage.put('duration', this._duration);
	}

	get duration() {
		return this._duration;
	}

	set increment(increment) {
		this._increment = increment;
		this.storage.put('increment', this._increment);
	}

	get increment() {
		return this._increment;
	}

	set lastRadio(lastRadio) {
		this._lastRadio = lastRadio;
		this.storage.put('lastRadio', this._lastRadio);
	}

	get lastRadio() {
		return this._lastRadio;
	}

	set updateAvailable(updateAvailable) {
		this._updateAvailable = updateAvailable;
		this.websocketServer.send('updateAvailable', this._updateAvailable);
	}

	get updateAvailable() {
		return this._updateAvailable;
	}
}
