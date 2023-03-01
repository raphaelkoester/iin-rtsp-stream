# RTSP Stream to WebSocket Server Library
This Node.js library allows you to easily stream RTSP video to a WebSocket server. It supports MPEG1 video with MPEGTS and is highly optimized and customizable.
This library is an altered version of node-rtsp-stream with performance improvements and a some new features implemented into it.

## Installation
To install this library, simply run:

`npm install iin-rtsp-stream`


## Usage
To use this library, create a new instance of the Stream class and pass in the RTSP stream URL and WebSocket server options:

```javascript
import * as Stream from 'iin-rtsp-stream';


let stream = await new Stream({
    name: "Stream #1",
    streamUrl: "rtsp://URL...",
    wsPort: 8000,
    ffmpegOptions: {
        '-r': 30,
        '-bufsize': '12000k',
        '-preset': 'slower',
        '-threads': 2,
        '-maxrate': '1500k',
        '-bf': 4,
        '-tune': 'grain',
        '-g': 90,
        '-vf': 'eq=contrast=1.1',
    },
});

stream.on('exitWithError', () => {
    stream.stop();
});

stream.on('stopped', () => {
    this.portManager.releasePort(stream.options.wsPort);
    stream.stop();
});

setTimeout(async () => {
    await new Promise(() => {
        console.log('Stopping Recording');
        stream.stop();
        Promise.resolve();
    });
}, 10 * 60 * 1000);
```

## API
Stream(options)
Creates a new instance of the Stream class.

options: An object containing the following properties:
name: The name of the stream (optional).
streamUrl: The URL of the RTSP stream.
wsPort: The port of the WebSocket server.
ffmpegOptions: An object containing the ffmpeg options to use for the stream (optional).
stream.on(event, listener)
Attaches a listener function to the specified event.

event: The event name. Possible events are:
exitWithError: Fired when ffmpeg exits with an error.
stopped: Fired when the stream has been stopped.
stream.stop()
Stops the stream.

## License
This library is licensed under the MIT License.