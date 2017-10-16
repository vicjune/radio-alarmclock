"use strict";

let wifi = require('pi-wifi');
let bleno = require('bleno');

module.exports = class ConnectionModule {
	constructor() {
		this.scanStarted = false;

		bleno.on('stateChange', state => {
			if (state === 'poweredOn') {
				bleno.startAdvertising('Mouton', ['1720648C-11ED-4847-9F49-86E839B6C9BE']);
			} else {
				bleno.stopAdvertising();
			}
		});

		bleno.on('advertisingStart', error => {
			if (!error) {
				this.characteristic = new bleno.Characteristic({
					uuid: 'B2FEBA5A-CADB-493C-AD72-34170D046C3B',
					properties: ['write'],
					value: null,
					onWriteRequest: (data, offset, withoutResponse, callback) => {this.onWriteWifi(data, callback)}
				});

				bleno.setServices([
					new bleno.PrimaryService({
						uuid: '4F5E0138-2439-4A16-8311-D4F1C500613B',
						characteristics: [this.characteristic]
					})
				]);
			} else {
				console.log(error);
			}
		});
	}

	// onReadWifi(callback) {
	// 	wifi.scan((err, networks) => {
	// 		let status;
	// 		let data;
	// 		if (!err) {
	// 			status = this.characteristic.RESULT_SUCCESS;
	// 			data = this.toBytes(networks.map(network => network.ssid).slice(0, 5));
	// 		} else {
	// 			status = this.characteristic.RESULT_UNLIKELY_ERROR;
	// 			data = this.toBytes('Error in wifi scan');
	// 		}
	// 		if (!this.scanStarted) {
	// 			this.scanStarted = true;
	// 			callback(status, data);
	// 		}
	// 	});
	// }

	onWriteWifi(data, callback) {
		let response = this.fromBytes(data);
		console.log(response);

		if (response) {
			setTimeout(() => {
				callback(this.characteristic.RESULT_UNLIKELY_ERROR);
				// callback(this.characteristic.RESULT_SUCCESS);
			}, 2000);
		} else {
			callback(this.characteristic.RESULT_UNLIKELY_ERROR);
		}
	}

	toBytes(payload) {
		let jsonString = JSON.stringify(payload);
		var array = new Uint8Array(jsonString.length);
		for (var i = 0, l = jsonString.length; i < l; i++) {
			array[i] = jsonString.charCodeAt(i);
		}
		return Buffer.from(array.buffer);
	}

	fromBytes(buffer) {
		try {
			return JSON.parse(String.fromCharCode.apply(null, new Uint8Array(buffer)));
		} catch (err) {
			console.error(err);
			return null;
		}
	}
}
