"use strict";

let spawn = require('child_process').spawn;
let git = require('simple-git')();

module.exports = class UpdateModule {
	constructor(localStorage) {
		this.updating = false;
		this.localStorage = localStorage;
		this.websocketServer = null;

		this.checkStatus();

		setInterval(() => {
			this.checkStatus();
		}, 86400000);
	}

	checkStatus() {
		console.log('Fetch');
		git.fetch((err, fetch) => {
			if (err === null) {
				if (fetch.remote !== null) {
					this.localStorage.updateAvailable = true;
				} else {
					this.localStorage.updateAvailable = false;
				}
			} else {
				console.log(err);
			}
		});
	}

	update() {
		if (!this.updating) {
			this.updating = true;

			console.log('Pull');
			git.pull((err, pull) => {
				if (err === null) {
					let repoChanges = false;
					let packageChanges = false;
					for (let file of pull.files) {
						if (file.startsWith('host-device/')) {
							repoChanges = true;
						}

						if (file === 'host-device/package.json') {
							packageChanges = true;
							break;
						}
					}

					if (repoChanges && !packageChanges) {
						this.restartApp();
					}

					if (packageChanges) {
						console.log('Npm install');
						spawn('npm', ['install']).on('close', npmCode => {
							console.log('Npm end - code: ' + npmCode);
							if (npmCode === 0) {
								this.restartApp();
							} else {
								this.sendError();
							}
						});
					}
				} else {
					this.sendError();
				}
			});
		}
	}

	restartApp() {
		console.log('Restart app');
		spawn('pm2', ['restart', 'radio-alarmclock']).on('close', code => {
			if (code !== 0) {
				this.sendError();
			}
		});
	}

	sendError() {
		console.log('Update error');
		this.updating = false;
		this.websocketServer.send('error', 'An error appeared while updating');
	}
}
