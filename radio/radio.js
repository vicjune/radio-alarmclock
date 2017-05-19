let version = 2;


let lame = require('lame');
let Speaker = require('speaker');
let loudness = require('loudness');
let WebSocket = require('ws');


// TEMP MOCK
let url = 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3';
let defaultRadioId = 0;
let radios = [
	{
		id: 0,
		label: 'France Info',
		url: 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3',
		validationPending: false,
		valid: true
	},
	{
		id: 1,
		label: 'France Inter',
		url: 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3',
		validationPending: false,
		valid: false
	},
	{
		id: 2,
		label: 'Skyrock',
		url: 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3',
		validationPending: false,
		valid: true
	}
];
let alarms = [{
	id: 0,
	days: [1, 2, 3, 4, 5],
	hour: 8,
	minute: 30,
	enabled: true,
	radioId: 0
},
{
	id: 1,
	days: [],
	hour: 10,
	minute: 30,
	enabled: false,
	radioId: 1
}];
let duration = 60;
let increment = 5;


// TODO Database
let databaseReady = false;







// Websocket
let socketServer = new WebSocket.Server({port: 8001});
socketServer.connectionCount = 0;
socketServer.on('connection', socket => {
	socketServer.connectionCount++;

	console.log('New WebSocket Connection');

	socket.send(JSON.stringify({
		type: 'version',
		data: version
	}));

	socket.send(JSON.stringify({
		type: 'playRadio',
		data: {
			playing: streamPlaying,
			loading: radioLoading
		}
	}));

	socket.send(JSON.stringify({
		type: 'config',
		data: {
			duration: duration,
			increment: increment
		}
	}));

	socket.send(JSON.stringify({
		type: 'alarmList',
		data: alarms
	}));

	socket.send(JSON.stringify({
		type: 'radioList',
		data: radios
	}));

	socket.send(JSON.stringify({
		type: 'defaultRadioId',
		data: defaultRadioId
	}));

	socket.on('message', (data) => {
		let payload = JSON.parse(data);

		if (payload.type === 'alarm') {
			let clientAlarm = payload.data;

			if (clientAlarm.delete) {
				for (let i = 0; i < alarms.length; ++i) {
					if (alarms[i].id === clientAlarm.id) {
						alarms.splice(i, 1);
						break;
					}
				}
			} else {
				let alarmExists = false;
				for (let alarm of alarms) {
					if (alarm.id === clientAlarm.id) {
						alarm.days = clientAlarm.days;
						alarm.hour = clientAlarm.hour;
						alarm.minute = clientAlarm.minute;
						alarm.enabled = clientAlarm.enabled;
						alarm.radioId = clientAlarm.radioId;
						alarmExists = true;
						break;
					}
				}
				if (!alarmExists) {
					alarms.push(clientAlarm);
				}
			}

			socketServer.broadcast(payload);
		}

		if (payload.type === 'radio') {
			let clientRadio = payload.data;

			if (clientRadio.delete) {
				for (let i = 0; i < radios.length; ++i) {
					if (radios[i].id === clientRadio.id) {
						let radioDeletedId = radios[i].id;
						radios.splice(i, 1);
						for (alarm of alarms) {
							if (alarm.radioId === radioDeletedId) {
								alarm.radioId = radios[0].id;

								socketServer.broadcast({
									type: 'alarm',
									data: alarm
								});
							}
						}
						break;
					}
				}
			} else {
				let radioExists = false;
				for (let radio of radios) {
					if (radio.id === clientRadio.id) {
						radio.label = clientRadio.label;
						let urlChange = radio.url !== clientRadio.url;
						radio.url = clientRadio.url;
						radioExists = true;
						if (urlChange) {
							radio.validationPending = true;

							checkUrlValidity(radio.url, valid => {
								radio.valid = valid;
								radio.validationPending = false;

								socketServer.broadcast({
									type: 'radioList',
									data: radios
								});
							});
						}
						break;
					}
				}
				if (!radioExists) {
					let newRadio = {
						id: clientRadio.id,
						label: clientRadio.label,
						url: clientRadio.url,
						valid: false,
						validationPending: true
					};

					radios.push(newRadio);

					checkUrlValidity(newRadio.url, valid => {
						newRadio.valid = valid;
						newRadio.validationPending = false;

						socketServer.broadcast({
							type: 'radioList',
							data: radios
						});
					});
				}
			}

			socketServer.broadcast({
				type: 'radioList',
				data: radios
			});
		}

		if (payload.type === 'defaultRadioId') {
			if (payload.data >= 0) {
				defaultRadioId = payload.data;
			}

			socketServer.broadcast({
				type: 'defaultRadioId',
				data: defaultRadioId
			});
		}

		if (payload.type === 'url') {
			checkUrlValidity(payload.data, valid => {
				socketServer.broadcast({
					type: 'url',
					data: valid
				});
			});
		}

		if (payload.type === 'playRadio') {
			if (payload.data) {
				startAlarm(false);

				for (radio of radios) {
					if (radio.url === url) {
						socketServer.broadcast({
							type: 'radioPlaying',
							data: radio
						});
						break;
					}
				}
			} else {
				stopAlarm();
			}
		}

		if (payload.type === 'config') {
			if (payload.data && payload.data.duration >= 0) {
				duration = payload.data.duration;
			}

			if (payload.data && payload.data.increment >= 0) {
				increment = payload.data.increment;
			}

			socketServer.broadcast({
				type: 'config',
				data: {
					duration: duration,
					increment: increment
				}
			});
		}
	});

	socket.on('close', (code, message) => {
		socketServer.connectionCount--;
		console.log(
			'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
		);
	});
});
socketServer.broadcast = data => {
	socketServer.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify(data));
		}
	});
};








// Stream validation
function checkUrlValidity(url, fn) {
	let valid = false;

	setTimeout(() => {
		fn(valid);
	}, 2000);
}








// Radio
let killStream = false;
let radioLoading = false;

function toggleStream(on, url = null) {
	if (!radioLoading) {
		socketServer.broadcast({
			type: 'playRadio',
			data: {
				playing: on,
				loading: true
			}
		});
		radioLoading = true;
		if (on) {
			startClient(url, () => {
				console.log('Radio started');
				socketServer.broadcast({
					type: 'playRadio',
					data: {
						playing: true,
						loading: false
					}
				});
				radioLoading = false;
			}, (error, end) => {
				console.log('Radio error', error);
				radioLoading = false;
				if (error === 'timeout' && !end) {
					toggleStream(true, url);
				} else {
					socketServer.broadcast({
						type: 'error',
						data: 'Couldn\'t read the radio :/'
					});

					socketServer.broadcast({
						type: 'playRadio',
						data: {
							playing: false,
							loading: false
						}
					});
				}
			}, () => {
				console.log('Radio closed');
				socketServer.broadcast({
					type: 'playRadio',
					data: {
						playing: false,
						loading: false
					}
				});
				radioLoading = false;
			});
		} else {
			killStream = true;
		}
	}
}

function startClient(url, fn, fnError, fnEnd) {
	let u = require('url').parse(url);
	require('dns').resolve(u.hostname, (err, addresses) => {
		let ip = u.hostname;
		if (addresses) {
			ip = addresses[0];
		}

		let client = new require('net').Socket();
		client.connect(u.port, ip, () => {
			client.write('Get ' + u.path + ' HTTP/1.0\r\n');
			client.write('User-Agent: Mozilla/5.0\r\n');
			client.write('\r\n');
		});

		let start = true;
		let end = false;
		let clientCloseTimeout = null;

		client.on('data', data => {
			if (clientCloseTimeout) {
				clearTimeout(clientCloseTimeout);
			}
			clientCloseTimeout = setTimeout(() => {
				client.destroy();
				lameDecoder.unpipe();
				speaker.close();
				fnError('timeout', killStream);
				killStream = false;
			}, 10000);

			if (start) {
				fn();
				start = false;
			}

			if (killStream) {
				client.destroy();
				lameDecoder.unpipe();
				killStream = false;
				end = true;
			}
			if (end) {
				if (clientCloseTimeout) {
					clearTimeout(clientCloseTimeout);
				}
				clientCloseTimeout = setTimeout(() => {
					speaker.close();
					fnEnd();
				}, 1000);
			}
		});

		client.on('error', err => {
			client.destroy();
			lameDecoder.unpipe();
			killStream = false;
			speaker.close();
			fnError(err, true);
		});

		let lameDecoder = new lame.Decoder();
		let speaker = new Speaker();
		client.pipe(lameDecoder).pipe(speaker);
	});
}











// Clock
let streamPlaying = false;
let durationTimeout = null;
let incrementalInterval = null;

function startClock() {
	console.log('Server started');
	let preparationInterval = setInterval(() => {
		if (new Date().getSeconds() === 0) {
			clearInterval(preparationInterval);
			console.log('Clock started');

			setInterval(() => {
				let now = new Date();
				let triggerAlarms = false;
				for (let alarm of alarms) {
					let triggerAlarm = (alarm.days.indexOf(now.getDay()) >= 0 || alarm.days.length === 0) && now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && alarm.enabled;
					triggerAlarms = triggerAlarms || triggerAlarm;
					if (triggerAlarm && alarm.days.length === 0) {
						alarm.enabled = false;
						socketServer.broadcast({
							type: 'alarm',
							data: alarm
						});
					}
				}
				if (triggerAlarms) {
					startAlarm(true);
				}
			}, 60000);
		}
	}, 100);
}

function startAlarm(incremental) {
	if (streamPlaying) {
		if (durationTimeout) {
			clearTimeout(durationTimeout);
		}
	} else {
		streamPlaying = true;
		toggleStream(true, url);
		console.log('Alarm started');

		if (incremental && increment > 0) {
			loudness.setVolume(0, err => {});
			let staticIncrement = increment;
			let volume = 60;
			incrementalInterval = setInterval(() => {
				volume = volume + (100 - 60) / (staticIncrement * 60);
				if (volume <= 100 && streamPlaying) {
					setVolume(Math.floor(volume));
				} else {
					clearInterval(incrementalInterval);
					incrementalInterval = null;
				}
			}, 1000);
		}
	}

	if (!incremental || increment === 0) {
		setVolume(100);
		if (incrementalInterval) {
			clearInterval(incrementalInterval);
			incrementalInterval = null;
		}
	}

	if (duration > 0 && duration < 120) {
		durationTimeout = setTimeout(() => {
			stopAlarm();
		}, duration * 60000);
	}
}

function stopAlarm() {
	if (streamPlaying) {
		if (incrementalInterval) {
			clearInterval(incrementalInterval);
			incrementalInterval = null;
		}
		clearTimeout(durationTimeout);
		streamPlaying = false;
		toggleStream(false);
		console.log('Alarm stopped');
	}
}

function setVolume(volume) {
	socketServer.broadcast({
		type: 'volume',
		data: volume
	});
	loudness.setVolume(volume, err => {});
}

startClock();
