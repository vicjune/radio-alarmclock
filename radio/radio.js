let lame = require('lame');
let Speaker = require('speaker');
let loudness = require('loudness');
let WebSocket = require('ws');


// TEMP MOCK
let url = 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3';
let alarms = [{
    id: 0,
    days: [1, 2, 3, 4, 5],
    hour: 8,
    minute: 30,
    enabled: true
}];
let duration = 60;
let increase = 5;


// TODO Database
let databaseReady = false;









// Websocket
let socketServer = new WebSocket.Server({port: 8001});
socketServer.connectionCount = 0;
socketServer.on('connection', socket => {
    socketServer.connectionCount++;

    console.log('New WebSocket Connection');

    socket.send(JSON.stringify({
        type: 'toggleStream',
        data: streamPlaying
    }));

    // if (databaseReady) {
        socket.send(JSON.stringify({
            type: 'config',
            data: {
                url: url,
                duration: duration,
                increase: increase
            }
        }));

        for (let alarm of alarms) {
            socket.send(JSON.stringify({
                type: 'alarm',
                data: alarm
            }));
        }
    // }

    socket.on('message', (data) => {
        if (JSON.parse(data).type === 'alarm') {
            let clientAlarm = JSON.parse(data).data;
            let alarmExists = false;
            for (let alarm of alarms) {
                if (alarm.id === clientAlarm.id) {
                    alarm.days = clientAlarm.days;
                    alarm.hour = clientAlarm.hour;
                    alarm.minute = clientAlarm.minute;
                    alarm.enabled = clientAlarm.enabled;
                    alarmExists = true;
                    break;
                }
            }
            if (!alarmExists) {
                alarms.push(clientAlarm);
            }
            socketServer.broadcast({
                type: 'alarm',
                data: clientAlarm
            });
        }
        console.log(alarms);
    });

    socket.on('close', (code, message) => {
        socketServer.connectionCount--;
        console.log(
            'Disconnected WebSocket ('+socketServer.connectionCount+' total)'
        );
    });
});
socketServer.broadcast = function(data) {
    socketServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};










// Radio
let killStream = true;

function toggleStream(on, url = null) {
    if (on) {
        if (killStream) {
            killStream = false;
            startClient(url, (err, cbClient) => {
                if (err === null) {
                    console.log('Radio started');
                } else {
                    console.error(err);
                }
            });
        }
    } else {
        killStream = true;
    }
}

function startClient(url, fn) {
    let u = require('url').parse(url);
    require('dns').resolve(u.hostname, (err, addresses) => {
        let ip=u.hostname;
        if (addresses)
            ip = addresses[0];
        let client = new require('net').Socket();
        client.connect(u.port, ip, () => {
            client.write('Get ' + u.path + ' HTTP/1.0\r\n');
            client.write('User-Agent: Mozilla/5.0\r\n');
            client.write('\r\n');
        });
        let start = true;
        client.on('data', data => {
            if (start) {
                fn(null, client);
                start = false;
            }
            if (killStream) {
                speaker.close();
                setTimeout(() => {
                    client.destroy();
                });
            }
        });
        client.on('error', err => {
            fn(err, null);
        });
        client.on('close', () => {
            console.log('Radio closed');
        });
        let speaker = client.pipe(new lame.Decoder()).pipe(new Speaker());
    });
}











// Clock
let streamPlaying = false;
let durationTimeout;

function startClock() {
    let preparationInterval = setInterval(() => {
        if (new Date().getSeconds() === 0) {
            clearInterval(preparationInterval);

            setInterval(() => {
                let now = new Date();
                let triggerAlarm = false;
                for (let alarm of alarms) {
                    triggerAlarm = triggerAlarm || alarm.days.indexOf(now.getDay()) >= 0 && now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && alarm.enabled;
                }
                if (triggerAlarm) {
                    if (streamPlaying) {
                        clearTimeout(durationTimeout);
                        startAlarm(false);
                    } else {
                        startAlarm(true);
                    }
                }
            }, 60000);
        }
    }, 100);
}

function startAlarm(incremental) {
    toggleAlarm(true, incremental);

    durationTimeout = setTimeout(() => {
        toggleAlarm(false);
    }, duration * 60000);
}

function toggleAlarm(on, incremental = false) {
    socketServer.broadcast({
        type: 'toggleStream',
        data: on
    });

    if (on) {
        streamPlaying = true;

        if (incremental) {
            console.log('Alarm');
            loudness.setVolume(0, err => {});
            toggleStream(true, url);
            let volume = 60;
            let interval = setInterval(() => {
                volume = volume + (100 - 60) / (increase * 60);
                if (volume <= 100 && streamPlaying) {
                    setVolume(Math.floor(volume))
                } else {
                    clearInterval(interval);
                }
            }, 1000);
        }
    } else {
        streamPlaying = false;
        toggleStream(false);
        console.log('Alarm stopped');
    }
}

function setVolume(volume) {
    socketServer.broadcast({
        type: 'volume',
        data: volume
    });
    loudness.setVolume(volume, err => {});
}

startClock();
