const spawn = require('child_process').spawn;
const git = require('simple-git');

import { LocalStorage } from '../storage/LocalStorage';

export class UpdateModule {
  updating = false;
  localStorage: LocalStorage;
  websocketServer = null;

  constructor(localStorage: LocalStorage) {
    this.localStorage = localStorage;

    this.checkStatus();

    setInterval(() => {
      this.checkStatus();
    }, 86400000);
  }

  checkStatus() {
    console.log('Fetch');
    git().fetch((err, fetch) => {
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
      git().pull((err, pull) => {
        if (err === null) {
          let repoChanges = false;
          let packageChanges = false;
          for (const file of pull.files) {
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
            spawn('npm', ['install']).on('close', (npmCode) => {
              console.log('Npm end - code: ' + npmCode);
              if (npmCode === 0) {
                this.restartApp();
              } else {
                this.sendError();
              }
            });
          }

          if (!repoChanges && !packageChanges) {
            this.updating = false;
            this.websocketServer.send('version', this.localStorage.version);
            this.localStorage.updateAvailable = false;
          }
        } else {
          this.sendError();
        }
      });
    }
  }

  restartApp() {
    console.log('Restart app');
    spawn('pm2', ['restart', 'radio-alarmclock']).on('close', (code) => {
      if (code !== 0) {
        this.sendError();
      }
    });
  }

  sendError() {
    console.log('Update error');
    this.updating = false;
    this.websocketServer.send('error', 'An error appeared while updating');
    this.websocketServer.send('version', this.localStorage.version);
  }
}
