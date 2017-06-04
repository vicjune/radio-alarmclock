"use strict";

let spawn = require('child_process').spawn;
let git = require('simple-git')();

module.exports = class UpdateModule {
	constructor() {
		this.updating = false;
		this.websocketServer = null;

		this.checkStatus();
	}

	checkStatus() {
		git.fetch((err, update) => {
			console.log('fetch');
			console.log(update);
		});

		git.status((err, update) => {
			console.log('status');
			console.log(update);
		});

		git.pull((err, update) => {
			console.log('pull');
			console.log(update);
		});
	}

	update() {
		if (!this.updating) {
			this.updating = true;
			spawn('git', ['pull']).on('close', pullCode => {
				console.log('Git pull close - code: ' + pullCode);

				if (pullCode === 0) {
					spawn('npm', ['install']).on('close', npmCode => {
						console.log('Npm close - code: ' + npmCode);

						if (npmCode === 0) {
							spawn('pm2', ['restart', 'radio-alarmclock']).on('close', pm2Code => {
								if (pm2Code !== 0) {
									this.sendError();
								}
							});
						} else {
							this.sendError();
						}
					});
				} else {
					this.sendError();
				}
			});
		}
	}

	sendError() {
		console.log('Update error');
		this.updating = false;
		this.websocketServer.send('error', 'An error appeared while updating');
	}
}
