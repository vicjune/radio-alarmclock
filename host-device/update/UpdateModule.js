"use strict";

let spawn = require('child_process').spawn;

module.exports = class UpdateModule {
	constructor() {
		this.websocketServer = null;

		setTimeout(() => {
			this.update();
		}, 10000);
	}

	update() {
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

	sendError() {
		console.log('Update error');
		this.websocketServer.send('error', 'An error appeared while updating');
	}
}
