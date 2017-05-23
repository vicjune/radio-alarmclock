let urlModule = require('url');
let dnsModule = require('dns');
let netModule = require('net');
let lame = require('lame');
let Speaker = require('speaker');

// Private



// Public
let self;
module.exports = RadioClient;
function RadioClient (url, fn, fnError, fnEnd, test = false) {
	self = this;
    this.parsedUrl = urlModule.parse(url);
	this.successFb = fn;
	this.errorFb = fnError;
	this.completeFb = fnEnd;
	this.testMode = test;

	this.client = new netModule.Socket();
	if (!this.testMode) {
		this.lameDecoder = new lame.Decoder();
		this.speaker = new Speaker();
	}

	this.connect();
};

RadioClient.prototype.connect = () => {
	dnsModule.resolve(self.parsedUrl.hostname, (err, addresses) => {
		if (addresses) {
			self.ipAddress = addresses[0];
		}

		self.createClient();
	});
}

// RadioClient.prototype = {
// 	connect: () => {
// 		dnsModule.resolve(self.parsedUrl.hostname, (err, addresses) => {
// 			if (addresses) {
// 				self.ipAddress = addresses[0];
// 			}
//
// 			self.createClient();
// 		});
// 	},
//
// 	createClient: () => {
// 		console.log('ok');
// 		self.client.connect(self.parsedUrl.port, self.ipAddress, () => {
// 			self.client.write('Get ' + u.path + ' HTTP/1.0\r\n');
// 			self.client.write('User-Agent: Mozilla/5.0\r\n');
// 			self.client.write('\r\n');
// 		});
//
// 		// let start = true;
// 		// let end = false;
// 		// let clientCloseTimeout = null;
// 		//
// 		// client.on('data', data => {
// 		// 	if (clientCloseTimeout) {
// 		// 		clearTimeout(clientCloseTimeout);
// 		// 	}
// 		// 	clientCloseTimeout = setTimeout(() => {
// 		// 		if (!test){
// 		// 			lameDecoder.unpipe();
// 		// 			speaker.close();
// 		// 		}
// 		// 		client.destroy();
// 		// 		fnError('timeout', killStream);
// 		// 		killStream = false;
// 		// 	}, 10000);
// 		//
// 		// 	if (!start && !killStream) {
// 		// 		fn();
// 		// 		if (test) {
// 		// 			killStream = true;
// 		// 		}
// 		// 	}
// 		//
// 		// 	if (start) {
// 		// 		start = false;
// 		// 	}
// 		//
// 		// 	if (killStream) {
// 		// 		if (!test) {
// 		// 			lameDecoder.unpipe();
// 		// 		}
// 		// 		client.destroy();
// 		// 		killStream = false;
// 		// 		end = true;
// 		// 	}
// 		// 	if (end) {
// 		// 		if (clientCloseTimeout) {
// 		// 			clearTimeout(clientCloseTimeout);
// 		// 		}
// 		// 		if (!test) {
// 		// 			clientCloseTimeout = setTimeout(() => {
// 		// 				speaker.close();
// 		// 				fnEnd();
// 		// 			}, 1000);
// 		// 		}
// 		// 	}
// 		// });
// 		//
// 		// client.on('error', err => {
// 		// 	if (!test) {
// 		// 		client.destroy();
// 		// 		lameDecoder.unpipe();
// 		// 		killStream = false;
// 		// 		speaker.close();
// 		// 	}
// 		// 	if (!test || start) {
// 		// 		fnError(err, true);
// 		// 	}
// 		// });
// 		//
// 		// let lameDecoder;
// 		// let speaker;
// 		//
// 		// if (!test) {
// 		// 	client.pipe(lameDecoder).pipe(speaker);
// 		// }
// 	}
// }
