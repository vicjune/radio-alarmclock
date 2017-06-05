"use strict";

let loudness = require('loudness');
let RadioClient = require('./RadioClient.js');

module.exports = class RadioModule {
	constructor(localStorage, websocketServer) {
		this.lastUrl = null;
		this.timeoutCounter = 0;
		this.radioClient = null;

		this.localStorage = localStorage;
		this.websocketServer = websocketServer;
	}

	startStream(url) {
		if (!this.localStorage.radioLoading) {
			this.websocketServer.send('playRadio', {
				playing: true,
				loading: true
			});

			this.localStorage.radioLoading = true;

			if (!this.localStorage.radioPlaying) {
				this.startClient(url);
			} else {
				loudness.setVolume(0, err => {});
				this.radioClient.stopStream(() => {
					this.startClient(url);
				});
			}
		}
	}

	stopStream() {
		if (!this.localStorage.radioLoading) {
			this.websocketServer.send('playRadio', {
				playing: false,
				loading: true
			});

			this.localStorage.radioLoading = true;
			loudness.setVolume(0, err => {});

			if (this.radioClient !== null) {
				this.radioClient.stopStream(() => {
					console.log('Radio closed');

					this.websocketServer.send('playRadio', {
						playing: false,
						loading: false
					});

					this.localStorage.radioLoading = false;
				});
			}
		}
	}

	startClient(url) {
		if (this.lastUrl === url) {
			this.timeoutCounter ++;
		} else {
			this.timeoutCounter = 0;
		}

		this.lastUrl = url;
		this.radioClient = new RadioClient(this.localStorage);

		this.radioClient.startStream(url, () => {
			console.log('Radio started');

			this.websocketServer.send('playRadio', {
				playing: true,
				loading: false
			});
			this.localStorage.radioLoading = false;
		}, (error, end) => {
			console.log('Radio error', error);
			this.localStorage.radioLoading = false;

			if (error === 'timeout' && !end && this.timeoutCounter < 1) {
				this.startClient(url);
			} else {
				this.websocketServer.send('error', 'Couldn\'t read the radio :/');

				this.websocketServer.send('playRadio', {
					playing: false,
					loading: false
				});
			}
		});
	}

	setVolume(volume) {
		this.websocketServer.send('volume', volume);
		loudness.setVolume(volume, err => {});
	}
}
