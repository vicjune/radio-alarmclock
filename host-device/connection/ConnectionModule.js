"use strict";

let wifi = require('node-wifi');
let bleno = require('bleno');

module.exports = class ConnectionModule {
	constructor() {
		this.characteristic = new bleno.Characteristic({
			uuid: 'B2FEBA5A-CADB-493C-AD72-34170D046C3B',
			properties: ['read'],
			value: null,
			onReadRequest: (offset, callback) => {
				console.log('hello');
				callback(this.characteristic.RESULT_SUCCESS, this.toBytes('coucou blue'));
			}
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

		let result = this.characteristic.RESULT_SUCCESS;
		// let data = Buffer.from('hello world', 'ascii');

		callback(this.characteristic.RESULT_SUCCESS, this.toBytes('coucou blue'));

		// wifi.scan((err, networks) => {
		// 	let result;
		// 	let data;
		// 	if (!err) {
		// 		result = this.characteristic.RESULT_SUCCESS;
		// 		data = new Buffer(0).toString(networks);
		// 	} else {
		// 		result = this.characteristic.RESULT_SUCCESS;
		// 		data = new Buffer(0).toString('Error in wifi scan');
		// 	}
		// 	callback(null, data);
		// });
	}

	toBytes(payload) {
		let jsonString = JSON.stringify(payload);
		var array = new Uint8Array(jsonString.length);
		for (var i = 0, l = jsonString.length; i < l; i++) {
			array[i] = jsonString.charCodeAt(i);
		}
		return array.buffer;
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
