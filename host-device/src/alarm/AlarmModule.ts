import { RadioModule } from '../radio/RadioModule';
import { WebsocketServer } from '../server/WebsocketServer';
import { LocalStorage } from './../storage/LocalStorage';

export class AlarmModule {
  durationTimeout = null;
  incrementalInterval = null;
  localStorage: LocalStorage;
  radioModule: RadioModule;
  websocketServer: WebsocketServer;

  constructor(localStorage: LocalStorage, radioModule: RadioModule, websocketServer: WebsocketServer) {
    this.durationTimeout = null;
    this.incrementalInterval = null;

    this.localStorage = localStorage;
    this.radioModule = radioModule;
    this.websocketServer = websocketServer;
  }

  startClock() {
    const preparationInterval = setInterval(() => {
      if (new Date().getSeconds() === 0) {
        clearInterval(preparationInterval);
        console.log('Clock started');

        setInterval(() => {
          const now = new Date();
          let triggerAlarms = false;
          let triggeredAlarm = null;
          for (const alarm of this.localStorage.alarms) {
            const triggerAlarm = (alarm.days.indexOf(now.getDay()) >= 0 || alarm.days.length === 0) &&
            now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && alarm.enabled;
            triggerAlarms = triggerAlarms || triggerAlarm;
            if (triggerAlarms && !triggeredAlarm) {
              triggeredAlarm = alarm;
            }
            if (triggerAlarm && alarm.days.length === 0) {
              alarm.enabled = false;
              this.websocketServer.send('alarm', alarm);
            }
          }
          if (triggerAlarms) {
            this.localStorage.lastRadio = this.localStorage.getRadio(triggeredAlarm.radioId);
            this.startAlarm(true, this.localStorage.lastRadio);
            triggeredAlarm = null;
          }
        }, 60000);
      }
    }, 100);
  }

  startAlarm(incremental, radio) {
    console.log('Alarm started');

    this.websocketServer.send('radioPlaying', radio);

    if (this.durationTimeout) {
      clearTimeout(this.durationTimeout);
    }

    if (incremental && this.localStorage.increment > 0) {
      if (!this.localStorage.radioPlaying) {
        this.radioModule.setVolume(0);
        const staticIncrement = this.localStorage.increment;
        let volume = 60;
        this.incrementalInterval = setInterval(() => {
          volume = volume + (100 - 60) / (staticIncrement * 60);
          if (volume <= 100 && this.localStorage.radioPlaying) {
            this.radioModule.setVolume(Math.floor(volume));
          } else {
            clearInterval(this.incrementalInterval);
            this.incrementalInterval = null;
          }
        }, 1000);
      }
    } else {
      this.radioModule.setVolume(100);
      if (this.incrementalInterval) {
        clearInterval(this.incrementalInterval);
        this.incrementalInterval = null;
      }
    }

    this.radioModule.startStream(incremental, radio.url);

    if (this.localStorage.duration > 0 && this.localStorage.duration < 120) {
      this.durationTimeout = setTimeout(() => {
        this.stopAlarm();
      }, this.localStorage.duration * 60000);
    }
  }

  stopAlarm() {
    if (this.localStorage.radioPlaying) {
      if (this.incrementalInterval) {
        clearInterval(this.incrementalInterval);
        this.incrementalInterval = null;
      }
      clearTimeout(this.durationTimeout);
      this.radioModule.stopStream();
      console.log('Alarm stopped');
    }
  }
}
