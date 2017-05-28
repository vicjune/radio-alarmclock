"use strict";

let WebSocket = require('ws');
let RadioClient = require('../radio/RadioClient.js');

module.exports = class WebsocketServer {
	constructor(localStorage, updateModule) {
		this.connectionCount = 0;
		this.localStorage = localStorage;
		this.updateModule = updateModule;
		this.alarmModule = null;
		this.socketServer = new WebSocket.Server({port: 8001});


		this.socketServer.on('connection', socket => {
			this.handleNewConnection(socket);

			socket.on('message', data => {
				this.handleIncomingMessage(data);
			});

			socket.on('close', data => {
				this.connectionCount--;
			});
		});

		console.log('Server started');
	}

	handleNewConnection(socket) {
		this.connectionCount++;

		let initWebsocket = [
			{
				type: 'version',
				data: this.localStorage.version
			},
			{
				type: 'playRadio',
				data: {
					playing: this.localStorage.radioPlaying,
					loading: this.localStorage.radioLoading
				}
			},
			{
				type: 'config',
				data: {
					duration: this.localStorage.duration,
					increment: this.localStorage.increment
				}
			},
			{
				type: 'alarmList',
				data: this.localStorage.alarms
			},
			{
				type: 'radioList',
				data: this.localStorage.radios
			},
			{
				type: 'defaultRadioId',
				data: this.localStorage.defaultRadioId
			}
		];

		for (let item of initWebsocket) {
			socket.send(JSON.stringify(item));
		}
	}

	handleIncomingMessage(data) {
		let payload = JSON.parse(data);

		if (payload.type === 'alarm') {
			let clientAlarm = payload.data;

			if (clientAlarm.delete) {
				for (let i = 0; i < this.localStorage.alarms.length; ++i) {
					if (this.localStorage.alarms[i].id === clientAlarm.id) {
						this.localStorage.alarms.splice(i, 1);
						break;
					}
				}
			} else {
				let alarmExists = false;
				for (let alarm of this.localStorage.alarms) {
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
					this.localStorage.alarms.push(clientAlarm);
				}
			}

			this.send('alarm', clientAlarm);
		}

		if (payload.type === 'radio') {
			let clientRadio = payload.data;

			if (clientRadio.delete) {
				for (let i = 0; i < this.localStorage.radios.length; ++i) {
					if (this.localStorage.radios[i].id === clientRadio.id) {
						let radioDeletedId = this.localStorage.radios[i].id;
						this.localStorage.radios.splice(i, 1);
						for (alarm of alarms) {
							if (alarm.radioId === radioDeletedId) {
								alarm.radioId = this.localStorage.radios[0].id;

								this.send('alarm', alarm);
							}
						}
						break;
					}
				}
			} else {
				let radioExists = false;
				for (let radio of this.localStorage.radios) {
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

									this.send('radioList', radios);
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

					this.localStorage.radios.push(newRadio);

					new RadioClient().testUrl(newRadio.url, (url, valid) => {
						if (newRadio.url === url) {
							newRadio.valid = valid;
							newRadio.validationPending = false;

							this.send('radioList', radios);
						}
					})
				}
			}

			this.send('radioList', this.localStorage.radios);
		}

		if (payload.type === 'defaultRadioId') {
			if (payload.data >= 0) {
				this.localStorage.defaultRadioId = payload.data;
			}

			this.send('defaultRadioId', this.localStorage.defaultRadioId);
		}

		if (payload.type === 'url') {
			new RadioClient().testUrl(payload.data, (url, valid) => {
				this.send('url', {
					url: url,
					valid: valid
				});
			});
		}

		if (payload.type === 'playRadio') {
			if (payload.data.radioPlaying) {

				if (payload.data.radioId !== null) {
					this.localStorage.lastRadio = this.localStorage.getRadio(payload.data.radioId);
				}

				this.alarmModule.startAlarm(false, this.localStorage.lastRadio.url);

				this.send('radioPlaying', this.localStorage.lastRadio);
			} else {
				this.alarmModule.stopAlarm();
			}
		}

		if (payload.type === 'config') {
			if (payload.data && payload.data.duration >= 0) {
				this.localStorage.duration = payload.data.duration;
			}

			if (payload.data && payload.data.increment >= 0) {
				this.localStorage.increment = payload.data.increment;
			}

			this.send('config', {
				duration: this.localStorage.duration,
				increment: this.localStorage.increment
			});
		}
	}

	send(type, data) {
		this.socketServer.clients.forEach(client => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify({
					type: type,
					data: data
				}));
			}
		});
	}
}
