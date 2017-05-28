"use strict";

let version = 2;


let RadioModule = require('./radio/RadioModule.js');
let WebsocketServer = require('./server/WebsocketServer.js');
let LocalStorage = require('./storage/LocalStorage.js');
let AlarmModule = require('./alarm/AlarmModule.js');
// let UpdateModule = require('./update/UpdateModule.js');


let localStorage = new LocalStorage(version);
// let updateModule = new UpdateModule();
let updateModule = null;
let websocketServer = new WebsocketServer(localStorage, updateModule);
let radioModule = new RadioModule(localStorage, websocketServer);
let alarmModule = new AlarmModule(localStorage, radioModule, websocketServer);

websocketServer.alarmModule = alarmModule;

alarmModule.startClock();
