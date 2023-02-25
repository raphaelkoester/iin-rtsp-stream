const child_process = require('child_process');
const events = require('events');

class Mpeg1Muxer extends events.EventEmitter
{
  constructor(options)
  {
    super();
    const { url, ffmpegOptions, ffmpegPath } = options;
    this.url = url;
    this.ffmpegOptions = ffmpegOptions;
    this.exitCode = undefined;
    this.additionalFlags = [];

    if (ffmpegOptions)
    {
      for (const key in ffmpegOptions)
      {
        if (ffmpegOptions.hasOwnProperty(key))
        {
          this.additionalFlags.push(key);
          if (ffmpegOptions[key] !== undefined && ffmpegOptions[key] !== null)
          {
            this.additionalFlags.push(`${ffmpegOptions[key]}`);
          }
        }
      }
    }

    this.spawnOptions = [
      '-rtsp_transport',
      'tcp',
      '-i',
      this.url,
      '-f',
      'mpegts',
      '-codec:v',
      'mpeg1video',
      // additional ffmpeg options go here
      ...this.additionalFlags,
      '-'
    ];

    this.stream = child_process.spawn(ffmpegPath, this.spawnOptions, {
      detached: false
    });

    this.inputStreamStarted = true;

    this.stream.stdout.on('data', data =>
    {
      this.emit('mpeg1data', data);
    });

    this.stream.stderr.on('data', data =>
    {
      this.emit('ffmpegStderr', data);
    });

    this.stream.on('exit', (code, signal) =>
    {
      if (code === 1)
      {
        console.error('RTSP stream exited with error');
        this.exitCode = 1;
        this.emit('exitWithError');
      }
    });
  }
}

module.exports = Mpeg1Muxer;
