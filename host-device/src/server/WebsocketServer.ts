const WebSocket = require('ws');

import { LocalStorage } from '../storage/LocalStorage';
import { RadioClient } from './../radio/RadioClient';
import { UpdateModule } from './../update/UpdateModule';

export class WebsocketServer {
  connectionCount = 0;
  localStorage: LocalStorage;
  updateModule: UpdateModule;
  alarmModule = null;
  socketServer;

  constructor(localStorage: LocalStorage, updateModule: UpdateModule) {
    this.connectionCount = 0;
    this.localStorage = localStorage;
    this.updateModule = updateModule;
    this.alarmModule = null;
    this.socketServer = new WebSocket.Server({port: 8001});

    this.socketServer.on('connection', (socket) => {
      this.handleNewConnection(socket);

      socket.on('message', (data) => {
        this.handleIncomingMessage(data);
      });

      socket.on('close', (data) => {
        this.connectionCount--;
      });
    });

    console.log('Server started');
  }

  handleNewConnection(socket) {
    this.connectionCount++;

    const initWebsocket = [
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
      },
      {
        type: 'updateAvailable',
        data: this.localStorage.updateAvailable
      }
    ];

    for (const item of initWebsocket) {
      socket.send(JSON.stringify(item));
    }
  }

  handleIncomingMessage(data) {
    const payload = JSON.parse(data);

    if (payload.type === 'alarm') {
      const clientAlarm = payload.data;

      if (clientAlarm.delete) {
        this.localStorage.deleteAlarm(clientAlarm.id);
      } else {
        this.localStorage.editAlarm(clientAlarm);
      }

      this.send('alarm', clientAlarm);
    }

    if (payload.type === 'radio') {
      const clientRadio = payload.data;

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
          url,
          valid
        });
      });
    }

    if (payload.type === 'playRadio') {
      const radioId = payload.data.radioId;

      if (!this.localStorage.radioPlaying) {
        if (radioId !== null) {
          this.localStorage.lastRadio = this.localStorage.getRadio(radioId);
        }

        this.alarmModule.startAlarm(false, this.localStorage.lastRadio);
      } else {
        if (radioId === this.localStorage.lastRadio || radioId === null) {
          this.alarmModule.stopAlarm();
        } else {
          this.localStorage.lastRadio = this.localStorage.getRadio(radioId);
          this.alarmModule.startAlarm(false, this.localStorage.lastRadio);
        }
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

    if (payload.type === 'updateHost') {
      this.updateModule.update();
    }

    if (payload.type === 'checkUpdate') {
      this.updateModule.checkStatus();
    }
  }

  send(type, data) {
    this.socketServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type,
          data
        }));
      }
    });
  }
}
