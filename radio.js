let lame = require('lame');
let icecast = require('icecast');
let Speaker = require('speaker');
let loudness = require('loudness');

let url = 'http://chai5she.cdn.dvmr.fr:80/franceinfo-midfi.mp3';

icecast.get(url, res => {
    res.on('metadata', metadata => {
        let parsed = icecast.parse(metadata);
        console.log(parsed);
    });

    res.pipe(new lame.Decoder())
        .pipe(new Speaker());
});

// loudness.setMuted();

setTimeout(() => {
    // icecast.get(null);
    // instance.finish();
    // loudness.setVolume(10, function (err) {
    //     console.log(err);
    // });
}, 2000);