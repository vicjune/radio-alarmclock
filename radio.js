let lame = require('lame');
let icecast = require('icecast');
let Speaker = require('speaker');
let loudness = require('loudness');

let url = 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3';
let alarms = [{
    days: [1, 2, 3, 4, 5],
    hour: 8,
    minute: 30
}];
let duration = 60;
let increase = 5;

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
            triggerAlarm = triggerAlarm || alarm.days.indexOf(now.getDay()) >= 0 && now.getHours() === alarm.hour && now.getMinutes() === alarm.minute;
        }
        if (triggerAlarm) {
            if (streamPlaying) {
                clearTimeout(durationTimeout);
                startStream(false);
            } else {
                startStream(true);
            }
        }
    }, 60000);
}

function startStream(incremental) {
    streamPlaying = true;

    if (incremental) {
        console.log('Alarm');
        let volume = 60;
        let interval = setInterval(() => {
            volume = volume + (100 - 60) / (increase * 60);
            if (volume <= 100 && streamPlaying) {
                loudness.setVolume(Math.floor(volume), err => {});
            } else {
                clearInterval(interval);
            }
        }, 1000);
    }

    durationTimeout = setTimeout(() => {
        streamPlaying = false;
        loudness.setVolume(0, err => {});
        console.log('Alarm stopped');
    }, duration * 60000);
}

