const loudness = require('loudness');

import { RadioClient } from './RadioClient';
import { LocalStorage } from '../storage/LocalStorage';
import { WebsocketServer } from '../server/WebsocketServer';

export class RadioModule {
  lastUrl: string = null;
  timeoutCounter = 0;
  radioClient: RadioClient = null;
  localStorage: LocalStorage;
  websocketServer: WebsocketServer;

  constructor(localStorage: LocalStorage, websocketServer: WebsocketServer) {
    this.localStorage = localStorage;
    this.websocketServer = websocketServer;
  }

  startStream(fromAlarm, url) {
    if (!this.localStorage.radioLoading) {
      this.websocketServer.send('playRadio', {
        playing: true,
        loading: true
      });

      this.localStorage.radioLoading = true;

      if (!this.localStorage.radioPlaying) {
        this.startClient(fromAlarm, url);
      } else {
        this.radioClient.stopStream(() => {
          this.startClient(fromAlarm, url);
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
      loudness.setVolume(0, (err) => { });

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

  startClient(fromAlarm, url) {
    if (this.lastUrl === url) {
      this.timeoutCounter++;
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
        this.startClient(fromAlarm, url);
      } else {
        this.websocketServer.send('error', 'Couldn\'t read the radio :/');

        if (fromAlarm) {
          // play local song
        }

        this.websocketServer.send('playRadio', {
          playing: false,
          loading: false
        });
      }
    });
  }

  setVolume(volume) {
    this.websocketServer.send('volume', volume);
    loudness.setVolume(volume, (err) => { });
  }
}
