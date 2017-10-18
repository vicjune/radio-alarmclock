"use strict";

let wifi = require('pi-wifi');
let bleno = require('bleno');

module.exports = class ConnectionModule {
	constructor() {
		this.scanStarted = false;
		this.updateWifiCallback = null;

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
					properties: ['write', 'notify'],
					value: null,
					onSubscribe: (maxValueSize, updateValueCallback) => {this.onSubscribeWifi(updateValueCallback)},
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

	onSubscribeWifi(callback) {
		this.updateWifiCallback = callback;

		wifi.status('wlan0', (err, status) => {
			if (!err) {
				let result;
				this.updateWifiCallback(this.toBytes({
					ssid: status.ssid || null,
					ip: status.ip || null
				}));
				this.updateWifiCallback(this.toBytes({
					error: 'Mouton error: Couldn\'t get wifi status'
				}));
			} else {
				this.updateWifiCallback(this.toBytes({
					error: 'Mouton error: Couldn\'t get wifi status'
				}));
				console.log(err);
			}
		});
	}

	onWriteWifi(data, callback) {
		let response = this.fromBytes(data);

		if (response) {
			wifi.check(response.ssid, (err, result) => {
				if (!err) {

					let successStatus = this.characteristic.RESULT_SUCCESS;

					if (result.connected) {
						callback(successStatus);
					} else {
						wifi.connectTo(response, err => {
							if (!err) {
								setTimeout(() => {
									wifi.check(response.ssid, (err, status) => {

										if (!err && status.connected) {
											callback(successStatus);
											if (this.updateWifiCallback) {
												this.updateWifiCallback(this.toBytes({
													ssid: response.ssid,
													ip: status.ip
												}));
											}
										} else {
											console.log('Not connected to wifi');
											console.log(err);
											this.updateWifiCallback(this.toBytes({
												error: 'Mouton error: Error in connection secondary check'
											}));
										}

									});
								}, 2000);
							} else {
								console.log(err);
								this.updateWifiCallback(this.toBytes({
									error: 'Mouton error: Couldn\'t connect to wifi'
								}));
							}
						});
					}
				} else {
					console.log(err);
					this.updateWifiCallback(this.toBytes({
						error: 'Mouton error: Couldn\'t check device wifi'
					}));
				}
			});
		} else {
			this.updateWifiCallback(this.toBytes({
				error: 'Mouton error: Couldn\'t read SSID from your phone'
			}));
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
