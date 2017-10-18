"use strict";

let wifi = require('pi-wifi');
let bleno = require('bleno');

module.exports = class ConnectionModule {
	constructor() {
		this.scanStarted = false;
		this.updateWifiCallback = null;
		this.checkIpAddressTimeout = null;

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

		if (response && response.ssid) {
			wifi.check(response.ssid, (err, result) => {
				if (!err) {

					let successStatus = this.characteristic.RESULT_SUCCESS;

					if (result.connected) {
						callback(successStatus);
						if (this.updateWifiCallback) {
							this.updateWifiCallback(this.toBytes({
								ssid: response.ssid,
								ip: result.ip
							}));
						}
					} else {
						let networkInfos = response;

						wifi.connectTo(networkInfos, err => {
							if (!err) {
								if (this.checkIpAddressTimeout) {
									clearTimeout(this.checkIpAddressTimeout);
								}
								if (this.checkIpAddressTimeoutEnd) {
									clearTimeout(this.checkIpAddressTimeoutEnd);
									this.checkIpAddressTimeoutEnd = null;
								}

								this.checkConnectionStatus(networkInfos, (err, status) => {
									if (!err) {
										callback(successStatus);
										if (this.updateWifiCallback) {
											this.updateWifiCallback(this.toBytes({
												ssid: networkInfos.ssid,
												ip: status.ip
											}));
										}
									} else {
										console.log(err);
										this.updateWifiCallback(this.toBytes({
											error: err
										}));
									}
								});

							} else {
								console.log(err);
								this.updateWifiCallback(this.toBytes({
									error: 'Mouton error: Couldn\'t connect to wifi (password may be wrong)'
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

	checkConnectionStatus (networkInfos, callback) {
		if (!this.checkIpAddressTimeoutEnd) {
			this.checkIpAddressTimeoutEnd = setTimeout(() => {
				this.checkIpAddressTimeoutEnd = null;
				clearTimeout(this.checkIpAddressTimeout);
				callback('Mouton error: Wifi connection timeout');
			}, 20000);
		}
		this.checkIpAddressTimeout = setTimeout(() => {
			wifi.check(networkInfos.ssid, (err, status) => {

				if (status.ip && status.connected) {
					callback(null, status);
					if (this.updateWifiCallback) {
						this.updateWifiCallback(this.toBytes({
							ssid: networkInfos.ssid,
							ip: status.ip
						}));
					}
					clearTimeout(this.checkIpAddressTimeoutEnd);
				} else {
					this.checkConnectionStatus(networkInfos, callback);
				}

			});
		}, 2000);
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
