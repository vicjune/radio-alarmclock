let urlModule = require('url');
let dnsModule = require('dns');
let netModule = require('net');
let lame = require('lame');
let Speaker = require('speaker');

module.exports = RadioClient;

let self;
function TestClient() {
	self = this;
	this.end = false;
	this.clientTimeout = null;
	this.testTimeout = null;
	this.lameDecoder = null;
	this.speaker = null;

	this.client = new netModule.Socket();
};

TestClient.prototype = {
	connectClient: (url, fnError) => {
		let parsedUrl = urlModule.parse(url);
		let ipAddress;

		if (!parsedUrl.hostname || !parsedUrl.port || !parsedUrl.path) {
			fnError();
		} else {
			dnsModule.resolve(parsedUrl.hostname, (err, addresses) => {
				if (addresses) {
					ipAddress = addresses[0];
				}

				self.client.connect(parsedUrl.port, ipAddress, () => {
					self.client.write('Get ' + parsedUrl.path + ' HTTP/1.0\r\n');
					self.client.write('User-Agent: Mozilla/5.0\r\n');
					self.client.write('\r\n');
				});
			});
		}
	},

	startStream: (url, fnStart, fnError) => {
		self.connectClient(url, () => {
			self.closeStream(true);
			fnError(err, true);
		});

		self.lameDecoder = new lame.Decoder();
		self.speaker = new Speaker();
		self.client.pipe(self.lameDecoder).pipe(self.speaker);

		let firstPayloadReceived = false;
		let streamStarted = false;

		self.clientTimeout = setTimeout(() => {
			fnError('timeout', self.end);
			self.closeStream(true);
		}, 10000);

		self.client.on('data', data => {
			if (self.clientTimeout) {
				clearTimeout(self.clientTimeout);
			}

			self.clientTimeout = setTimeout(() => {
				fnError('timeout', self.end);
				self.closeStream(true);
			}, 10000);

			if (firstPayloadReceived && !self.end && !streamStarted) {
				fnStart();
				streamStarted = true;
			}

			if (!firstPayloadReceived) {
				firstPayloadReceived = true;
			}
		});

		self.client.on('error', err => {
			self.closeStream(true);
			fnError(err, true);
		});
	},

	stopStream: fnEnd => {
		self.closeStream(false);
		let endTimeout = null
		endTimeout = setTimeout(() => {
			self.speaker.close();
			fnEnd();
		}, 1000);

		self.client.on('data', () => {
			clearTimeout(endTimeout);
			endTimeout = setTimeout(() => {
				self.speaker.close();
				clearTimeout(self.clientTimeout);
				fnEnd();
			}, 1000);
		});
	},

	closeStream: closeSpeaker => {
		if (self.lameDecoder) {
			self.lameDecoder.unpipe();
		}
		self.client.destroy();
		if (self.clientTimeout) {
			clearTimeout(self.clientTimeout);
		}
		if (closeSpeaker && self.speaker) {
			self.speaker.close();
		}
		self.end = true;
	},

	testUrl: (url, fn) => {
		self.connectClient(url, () => {
			fn(url, false);
			self.end = true;
		});

		let firstPayloadReceived = false;

		self.testTimeout = setTimeout(() => {
			fn(url, false);
			self.closeTest();
		}, 10000);

		self.client.on('data', data => {
			if (self.testTimeout) {
				clearTimeout(self.testTimeout);
			}
			self.testTimeout = setTimeout(() => {
				fn(url, false);
				self.closeTest();
			}, 10000);

			if (firstPayloadReceived && !self.end) {
				fn(url, true);
				self.closeTest();
				if (self.testTimeout) {
					clearTimeout(self.testTimeout);
				}
			}

			if (!firstPayloadReceived) {
				firstPayloadReceived = true;
			}
		});

		self.client.on('error', err => {
			if (!self.end) {
				fn(url, false);
				self.closeTest();
			}
		});
	},

	closeTest: () => {
		// if (self.testTimeout) {
		// 	clearTimeout(self.testTimeout);
		// }

		self.client.destroy();
		self.end = true;
	}
}
