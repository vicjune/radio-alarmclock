const netModule = require('net');
const dnsModule = require('dns');
const lame = require('lame');
const request = require('request');
const Speaker = require('speaker');

import { LocalStorage } from '../storage/LocalStorage';

export class RadioClient {
  end = true;
  clientTimeout = null;
  testTimeout = null;
  lameDecoder = null;
  speaker = null;
  request = null;
  localStorage: LocalStorage;

  client = new netModule.Socket();

  constructor(localStorage: LocalStorage = null) {
    this.localStorage = localStorage;
  }

  connectClient(url, fnError) {
    this.end = false;

    try {
      const thisRequest = request.get(url);

      thisRequest.on('error', (err) => {
        fnError(err);
      });

      thisRequest.on('response', (response) => {
        const parsedUrl = response.request.uri;
        let ipAddress;

        if (!parsedUrl.hostname || !parsedUrl.path) {
          fnError('No hostname or path in url');
        } else {
          dnsModule.resolve(parsedUrl.hostname, (err, addresses) => {
            if (err !== null) {
              fnError(err);
            } else {
              if (addresses) {
                ipAddress = addresses[0];
              }

              if (!parsedUrl.port) {
                parsedUrl.port = 80;
              }

              this.client.connect(parsedUrl.port, ipAddress, () => {
                this.client.write('Get ' + parsedUrl.path + ' HTTP/1.0\r\n');
                this.client.write('User-Agent: Mozilla/5.0\r\n');
                this.client.write('\r\n');
              });
            }
          });
        }
      });
    } catch (e) {
      fnError(e);
    }
  }

  startStream(url, fnStart, fnError) {
    this.clientTimeout = setTimeout(() => {
      fnError('timeout', this.end);
      this.closeStream(true);
    }, 10000);

    this.connectClient(url, (err) => {
      this.closeStream(true);
      fnError(err, true);
      clearTimeout(this.clientTimeout);
    });

    this.localStorage.radioPlaying = true;

    this.lameDecoder = new lame.Decoder();
    this.speaker = new Speaker();
    this.client.pipe(this.lameDecoder).pipe(this.speaker);

    let firstPayloadReceived = false;
    let streamStarted = false;

    this.client.on('data', (data) => {
      clearTimeout(this.clientTimeout);

      this.clientTimeout = setTimeout(() => {
        fnError('timeout', this.end);
        this.closeStream(true);
      }, 10000);

      if (firstPayloadReceived && !this.end && !streamStarted) {
        fnStart();
        streamStarted = true;
      }

      if (!firstPayloadReceived) {
        firstPayloadReceived = true;
      }
    });

    this.client.on('error', (err) => {
      fnError(err, true);
      this.closeStream(true);
    });
  }

  stopStream(fnEnd) {
    this.closeStream(false);
    let endTimeout = null;
    endTimeout = setTimeout(() => {
      this.speaker.close();
      fnEnd();
    }, 1000);

    this.client.on('data', () => {
      clearTimeout(endTimeout);
      endTimeout = setTimeout(() => {
        this.speaker.close();
        clearTimeout(this.clientTimeout);
        fnEnd();
      }, 1000);
    });
  }

  closeStream(closeSpeaker) {
    if (this.lameDecoder) {
      this.lameDecoder.unpipe();
    }
    this.client.destroy();
    if (this.clientTimeout) {
      clearTimeout(this.clientTimeout);
    }
    if (closeSpeaker && this.speaker) {
      this.speaker.close();
    }
    this.end = true;
    this.localStorage.radioPlaying = false;
  }

  testUrl(url, fn) {
    this.connectClient(url, () => {
      fn(url, false);
      this.end = true;
    });

    let firstPayloadReceived = false;

    this.testTimeout = setTimeout(() => {
      fn(url, false);
      this.closeTest();
    }, 3000);

    this.client.on('data', (data) => {
      if (this.testTimeout) {
        clearTimeout(this.testTimeout);
      }
      this.testTimeout = setTimeout(() => {
        fn(url, false);
        this.closeTest();
      }, 3000);

      if (firstPayloadReceived && !this.end) {
        fn(url, true);
        this.closeTest();
      }

      if (!firstPayloadReceived) {
        firstPayloadReceived = true;
      }
    });

    this.client.on('error', (err) => {
      if (!this.end) {
        fn(url, false);
        this.closeTest();
      }
    });
  }

  closeTest() {
    if (this.testTimeout) {
      clearTimeout(this.testTimeout);
    }

    this.client.destroy();
    this.end = true;
  }
}
