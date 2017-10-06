"use strict";

// let wifi = require('node-wifi');
let wifi = require('pi-wifi');
let bleno = require('bleno');

module.exports = class ConnectionModule {
	constructor() {
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
					properties: ['read'],
					value: null,
					onReadRequest: (offset, callback) => {this.onReadWifi(offset, callback)}
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

		// wifi.init({ iface : null });
	}

	onReadWifi(offset, callback) {
		let scanStarted = false;
		wifi.scan((err, networks) => {
			let data;
			if (!err) {
				console.log(scanStarted);
				data = this.toBytes(networks.map(network => network.ssid));
			} else {
				data = this.toBytes('Error in wifi scan');
				console.log(err);
			}
			if (!scanStarted) {
				scanStarted = true;
				console.log(networks.map(network => network.ssid));
				console.log(scanStarted);
				callback(this.characteristic.RESULT_SUCCESS, data);
			}
		});
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

// wifi.scan((err, networks) => {
// 	console.log(networks);
// 	console.log('Connecting...');
//
// 	wifi.connect({ ssid : 'Carpediem', password : 'Verallia2017'}, err => {
// 		if (!err) {
// 			console.log('Connected!');
// 		} else {
// 			console.log(err);
// 		}
// 	});
// });
