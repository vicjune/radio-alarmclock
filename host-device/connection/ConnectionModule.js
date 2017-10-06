"use strict";

let wifi = require('node-wifi');
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
				bleno.setServices([
					new bleno.PrimaryService({
						uuid: 'ec00',
						characteristics: [
							new bleno.Characteristic({
								uuid: 'ec01',
								properties: ['read'],
								value: null,
								onReadRequest: this.onReadWifi
							})
						]
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
		console.log(offset);
		wifi.scan((err, networks) => {
			if (!err) {
				callback(networks);
			} else {
				callback('error in wifi');
			}
		});
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
