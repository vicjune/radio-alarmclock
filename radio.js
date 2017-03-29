let lame = require('lame');
let icecast = require('icecast');
let Speaker = require('speaker');
let loudness = require('loudness');
let WebSocket = require('ws');


// TEMP MOCK
let url = 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3';
let alarms = [{
    days: [1, 2, 3, 4, 5],
    hour: 8,
    minute: 30
}];
let duration = 60;
let increase = 5;



// TODO Database



// Websocket
let socketServer = new WebSocket.Server({port: 8001, perMessageDeflate: false});
socketServer.connectionCount = 0;
socketServer.on('connection', socket => {
    socketServer.connectionCount++;

    console.log(
        'New WebSocket Connection: ',
        socket.upgradeReq.socket.remoteAddress,
        socket.upgradeReq.headers['user-agent'],
        '('+socketServer.connectionCount+' total)'
    );

    socket.send({
        type: 'toggleStream',
        data: streamPlaying
    });

    socket.on('message', (data) => {
        console.log(data);
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
            client.send(data);
        }
    });
};



// Radio + clock
let streamPlaying = false;
let durationTimeout;

icecast.get(url, res => {
    res.on('metadata', metadata => {
        let parsed = icecast.parse(metadata);
        console.log('Radio started');

        startClock();
    });

    res.pipe(new lame.Decoder())
        .pipe(new Speaker());
});

loudness.setVolume(0, err => {});

function startClock() {
    setInterval(() => {
        let now = new Date();
        let triggerAlarm = false;
        for (let alarm of alarms) {
            triggerAlarm = triggerAlarm || alarm.days.indexOf(now.getDay()) >= 0 && now.getHours() === alarm.hour && now.getMinutes() === alarm.minute && now.getSeconds() === 0;
        }
        if (triggerAlarm) {
            if (streamPlaying) {
                clearTimeout(durationTimeout);
                startStream(false);
            } else {
                startStream(true);
            }
        }
    }, 1000);
}

function startStream(incremental) {
    toggleStream(true, incremental);

    durationTimeout = setTimeout(() => {
        toggleStream(false);
    }, duration * 60000);
}

function toggleStream(on, incremental = false) {
    socketServer.broadcast({
        type: 'toggleStream',
        data: on
    });

    if (on) {
        streamPlaying = true;

        if (incremental) {
            console.log('Alarm');
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
        loudness.setVolume(0, err => {});
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

