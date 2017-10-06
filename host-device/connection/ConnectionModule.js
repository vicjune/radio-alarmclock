"use strict";

let wifi = require('node-wifi');
let bleno = require('bleno');

module.exports = class ConnectionModule {
	constructor() {
		this.characteristic = new bleno.Characteristic({
			uuid: 'B2FEBA5A-CADB-493C-AD72-34170D046C3B',
			properties: ['read'],
			value: null,
			onReadRequest: (offset, callback) => {this.onReadWifi(offset, callback)}
		});

		bleno.on('stateChange', state => {
			if (state === 'poweredOn') {
				bleno.startAdvertising('Mouton', ['1720648C-11ED-4847-9F49-86E839B6C9BE']);
			} else {
				bleno.stopAdvertising();
			}
		});

		bleno.on('advertisingStart', error => {
			if (!error) {
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

		wifi.init({ iface : null });
	}

	onReadWifi(offset, callback) {
		console.log('read');

		// let data = new Buffer(4);
		// data.writeUInt32LE(3, 0);
		//
		// const arr = new Uint16Array(2);
		//
		// arr[0] = 5000;
		// arr[1] = 4000;
		//
		// // Shares memory with `arr`
		// const data = Buffer.from(arr.buffer);

		// callback(this.characteristic.RESULT_SUCCESS, data);
		// callback(this.characteristic.RESULT_SUCCESS, this.toBytes('coucou'));

		wifi.scan((err, networks) => {
			let data;
			if (!err) {
				data = this.toBytes(networks);
			} else {
				data = this.toBytes('Error in wifi scan');
			}
			data = this.toBytes({
				coucou: 'caca',
				papy: [3, 4]
			});
			callback(this.characteristic.RESULT_SUCCESS, data);
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
