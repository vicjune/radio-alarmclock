"use strict";

module.exports = class LocalStorage {
	constructor(version) {
		this.version = version;
		this.radioPlaying = false;
		this.radioLoading = false;

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
}
