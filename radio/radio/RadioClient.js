"use strict";

let urlModule = require('url');
let dnsModule = require('dns');
let netModule = require('net');
let lame = require('lame');
let Speaker = require('speaker');

module.exports = class RadioClient {
	constructor() {
		this.end = false;
		this.clientTimeout = null;
		this.testTimeout = null;
		this.lameDecoder = null;
		this.speaker = null;

		this.client = new netModule.Socket();
	}

	connectClient(url, fnError) {
		let parsedUrl = urlModule.parse(url);
		let ipAddress;

		if (!parsedUrl.hostname || !parsedUrl.path) {
			fnError();
		} else {
			dnsModule.resolve(parsedUrl.hostname, (err, addresses) => {
				if (addresses) {
					ipAddress = addresses[0];
				}

				if (!parsedUrl.port) {
					parsedUrl.port = 80;
				}

				this.client.connect(parsedUrl.port, ipAddress, () => {
					this.client.write('Get ' + parsedUrl.path + ' HTTP/1.0\r\n');
					this.client.write('User-Agent: Mozilla/5.0\r\n');
					this.client.write('\r\n');
				});
			});
		}
	}

	startStream(url, fnStart, fnError) {
		this.connectClient(url, () => {
			this.closeStream(true);
			fnError(err, true);
		});

		this.lameDecoder = new lame.Decoder();
		this.speaker = new Speaker();
		this.client.pipe(this.lameDecoder).pipe(this.speaker);

		let firstPayloadReceived = false;
		let streamStarted = false;

		this.clientTimeout = setTimeout(() => {
			fnError('timeout', this.end);
			this.closeStream(true);
		}, 10000);

		this.client.on('data', data => {
			if (this.clientTimeout) {
				clearTimeout(this.clientTimeout);
			}

			this.clientTimeout = setTimeout(() => {
				fnError('timeout', this.end);
				this.closeStream(true);
			}, 10000);

			if (firstPayloadReceived && !this.end && !streamStarted) {
				fnStart();
				streamStarted = true;
			}

			if (!firstPayloadReceived) {
				firstPayloadReceived = true;
			}
		});

		this.client.on('error', err => {
			this.closeStream(true);
			fnError(err, true);
		});
	}

	stopStream(fnEnd) {
		this.closeStream(false);
		let endTimeout = null
		endTimeout = setTimeout(() => {
			this.speaker.close();
			fnEnd();
		}, 1000);

		this.client.on('data', () => {
			clearTimeout(endTimeout);
			endTimeout = setTimeout(() => {
				this.speaker.close();
				clearTimeout(this.clientTimeout);
				fnEnd();
			}, 1000);
		});
	}

	closeStream(closeSpeaker) {
		if (this.lameDecoder) {
			this.lameDecoder.unpipe();
		}
		this.client.destroy();
		if (this.clientTimeout) {
			clearTimeout(this.clientTimeout);
		}
		if (closeSpeaker && this.speaker) {
			this.speaker.close();
		}
		this.end = true;
	}

	testUrl(url, fn) {
		this.connectClient(url, () => {
			fn(url, false);
			this.end = true;
		});

		let firstPayloadReceived = false;

		this.testTimeout = setTimeout(() => {
			fn(url, false);
			this.closeTest();
		}, 10000);

		this.client.on('data', data => {
			if (this.testTimeout) {
				clearTimeout(this.testTimeout);
			}
			this.testTimeout = setTimeout(() => {
				fn(url, false);
				this.closeTest();
			}, 10000);

			if (firstPayloadReceived && !this.end) {
				fn(url, true);
				this.closeTest();
			}

			if (!firstPayloadReceived) {
				firstPayloadReceived = true;
			}
		});

		this.client.on('error', err => {
			if (!this.end) {
				fn(url, false);
				this.closeTest();
			}
		});
	}

	closeTest() {
		if (this.testTimeout) {
			clearTimeout(this.testTimeout);
		}

		this.client.destroy();
		this.end = true;
	}
}
