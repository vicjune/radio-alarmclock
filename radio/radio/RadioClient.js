"use strict";

let urlModule = require('url');
let dnsModule = require('dns');
let netModule = require('net');
let lame = require('lame');
let Speaker = require('speaker');

function RadioClient() {
	this.end = false;
	this.clientTimeout = null;
	this.testTimeout = null;
	this.lameDecoder = null;
	this.speaker = null;

	this.client = new netModule.Socket();
};

RadioClient.prototype.connectClient = (url, fnError) => {
	let parsedUrl = urlModule.parse(url);
	let ipAddress;

	if (!parsedUrl.hostname || !parsedUrl.port || !parsedUrl.path) {
		fnError();
	} else {
		dnsModule.resolve(parsedUrl.hostname, (err, addresses) => {
			if (addresses) {
				ipAddress = addresses[0];
			}

			this.client.connect(parsedUrl.port, ipAddress, () => {
				this.client.write('Get ' + parsedUrl.path + ' HTTP/1.0\r\n');
				this.client.write('User-Agent: Mozilla/5.0\r\n');
				this.client.write('\r\n');
			});
		});
	}
}

RadioClient.prototype.startStream = (url, fnStart, fnError) => {
	console.log(this.end);
	self.connectClient(url, () => {
		self.closeStream(true);
		fnError(err, true);
	});

	this.lameDecoder = new lame.Decoder();
	this.speaker = new Speaker();
	this.client.pipe(this.lameDecoder).pipe(this.speaker);

	let firstPayloadReceived = false;
	let streamStarted = false;

	this.clientTimeout = setTimeout(() => {
		fnError('timeout', this.end);
		self.closeStream(true);
	}, 10000);

	this.client.on('data', data => {
		if (this.clientTimeout) {
			clearTimeout(this.clientTimeout);
		}

		this.clientTimeout = setTimeout(() => {
			fnError('timeout', this.end);
			self.closeStream(true);
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
		self.closeStream(true);
		fnError(err, true);
	});
};

RadioClient.prototype.stopStream = fnEnd => {
	self.closeStream(false);
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

RadioClient.prototype.closeStream = closeSpeaker => {
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
};

RadioClient.prototype.testUrl = (url, fn) => {
	self.connectClient(url, () => {
		fn(url, false);
		this.end = true;
	});

	let firstPayloadReceived = false;

	this.testTimeout = setTimeout(() => {
		fn(url, false);
		self.closeTest();
	}, 10000);

	this.client.on('data', data => {
		if (this.testTimeout) {
			clearTimeout(this.testTimeout);
		}
		this.testTimeout = setTimeout(() => {
			fn(url, false);
			self.closeTest();
		}, 10000);

		if (firstPayloadReceived && !this.end) {
			fn(url, true);
			self.closeTest();
			if (this.testTimeout) {
				clearTimeout(this.testTimeout);
			}
		}

		if (!firstPayloadReceived) {
			firstPayloadReceived = true;
		}
	});

	this.client.on('error', err => {
		if (!this.end) {
			fn(url, false);
			self.closeTest();
		}
	});
};

RadioClient.prototype.closeTest = () => {
	// if (this.testTimeout) {
	// 	clearTimeout(this.testTimeout);
	// }

	this.client.destroy();
	this.end = true;
};

module.exports = RadioClient;
