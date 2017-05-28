"use strict";

let RadioClient = require('../radio/RadioClient.js');

let WebSocket = require('ws');

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
				this.localStorage.deleteAlarm(clientAlarm.id);
			} else {
				this.localStorage.editAlarm(clientAlarm);
			}

			this.send('alarm', clientAlarm);
		}

		if (payload.type === 'radio') {
			let clientRadio = payload.data;

			if (clientRadio.delete) {
				this.localStorage.deleteRadio(clientRadio.id);
			} else {
				this.localStorage.editRadio(clientRadio);
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
