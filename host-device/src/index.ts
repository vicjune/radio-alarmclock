const version = 2;

import { AlarmModule } from './alarm/AlarmModule';
import { ConnectionModule } from './connection/ConnectionModule';
import { RadioModule } from './radio/RadioModule';
import { WebsocketServer } from './server/WebsocketServer';
import { LocalStorage } from './storage/LocalStorage';
import { UpdateModule } from './update/UpdateModule';

const connectionModule = new ConnectionModule();
const localStorage = new LocalStorage(version);
const updateModule = new UpdateModule(localStorage);
const websocketServer = new WebsocketServer(localStorage, updateModule);
const radioModule = new RadioModule(localStorage, websocketServer);
const alarmModule = new AlarmModule(localStorage, radioModule, websocketServer);

websocketServer.alarmModule = alarmModule;
localStorage.websocketServer = websocketServer;
updateModule.websocketServer = websocketServer;

alarmModule.startClock();
