"use strict";

let version = 2;


let loudness = require('loudness');
let WebSocket = require('ws');
let RadioClient = require('./radio/RadioClient.js');

// TEMP MOCK
let defaultRadioId = 0;
let radios = [
	{
		id: 0,
		label: 'France Info',
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
	radioId: 0
}];
let duration = 60;
let increment = 5;

let lastRadio = getRadio(defaultRadioId);


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

							new RadioClient().testUrl(radio.url, (url, valid) => {
								if (radio.url === url) {
									radio.valid = valid;
									radio.validationPending = false;

									socketServer.broadcast({
										type: 'radioList',
										data: radios
									});
								}
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

					new RadioClient().testUrl(newRadio.url, (url, valid) => {
						if (newRadio.url === url) {
							newRadio.valid = valid;
							newRadio.validationPending = false;

							socketServer.broadcast({
								type: 'radioList',
								data: radios
							});
						}
					})
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
			new RadioClient().testUrl(payload.data, (url, valid) => {
				socketServer.broadcast({
					type: 'url',
					data: {
						url: url,
						valid: valid
					}
				});
			});
		}

		if (payload.type === 'playRadio') {
			if (payload.data.radioPlaying) {

				if (payload.data.radioId !== null) {
					lastRadio = getRadio(payload.data.radioId);
				}

				startAlarm(false, lastRadio.url);

				socketServer.broadcast({
					type: 'radioPlaying',
					data: lastRadio
				});
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














// Radio
let radioLoading = false;
let lastUrl = null;
let timeoutCounter = 0;
let radioClient = null;

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
			if (lastUrl === url) {
				timeoutCounter ++;
			} else {
				timeoutCounter = 0;
			}
			lastUrl = url;
			radioClient = new RadioClient();
			radioClient.startStream(url, () => {
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
				if (error === 'timeout' && !end && timeoutCounter < 1) {
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
			});
		} else {
			loudness.setVolume(0, err => {});
			if (radioClient !== null) {
				radioClient.stopStream(() => {
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
			}
		}
	}
}

function getRadio(id) {
	for (let radio of radios) {
		if (radio.id === id) {
			return radio;
		}
	}
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
				let triggeredAlarm;
				for (let alarm of alarms) {
					let triggerAlarm = (alarm.days.indexOf(now.getDay()) >= 0 || alarm.days.length === 0) && now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && alarm.enabled;
					triggerAlarms = triggerAlarms || triggerAlarm;
					triggeredAlarm = alarm;
					if (triggerAlarm && alarm.days.length === 0) {
						alarm.enabled = false;
						socketServer.broadcast({
							type: 'alarm',
							data: alarm
						});
					}
				}
				if (triggerAlarms) {
					lastRadio = getRadio(triggeredAlarm.radioId);
					startAlarm(true, lastRadio.url);
				}
			}, 60000);
		}
	}, 100);
}

function startAlarm(incremental, url) {
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
