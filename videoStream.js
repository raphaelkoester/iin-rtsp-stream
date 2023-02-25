const ws = require('ws');
const util = require('util');
const events = require('events');
const Mpeg1Muxer = require('./mpeg1muxer');

const STREAM_MAGIC_BYTES = "jsmp"; // Must be 4 bytes

VideoStream = function (options)
{
  this.options = options;
  this.name = options.name;
  this.streamUrl = options.streamUrl;
  this.width = options.width;
  this.height = options.height;
  this.wsPort = options.wsPort;
  this.inputStreamStarted = false;
  this.stream = undefined;
  this.startMpeg1Stream();
  this.pipeStreamToSocketServer();
  return this;
};

util.inherits(VideoStream, events.EventEmitter);

VideoStream.prototype.stop = function ()
{
  this.wsServer.close();
  this.stream.kill();
  this.inputStreamStarted = false;
  return this;
};

VideoStream.prototype.startMpeg1Stream = function ()
{
  let gettingInputData = false;
  let inputData = [];
  let gettingOutputData = false;
  let outputData = [];

  this.mpeg1Muxer = new Mpeg1Muxer({
    ffmpegOptions: this.options.ffmpegOptions,
    url: this.streamUrl,
    ffmpegPath: this.options.ffmpegPath == undefined ? "ffmpeg" : this.options.ffmpegPath
  });
  this.stream = this.mpeg1Muxer.stream;
  if (this.inputStreamStarted)
  {
    return;
  }
  this.mpeg1Muxer.on('mpeg1data', (data) =>
  {
    return this.emit('camdata', data);
  });
  gettingInputData = false;
  inputData = [];
  gettingOutputData = false;
  outputData = [];
  this.mpeg1Muxer.on('ffmpegStderr', (data) =>
  {
    var size;
    data = data.toString();
    if (data.indexOf('Input #') !== -1)
    {
      gettingInputData = true;
    }
    if (data.indexOf('Output #') !== -1)
    {
      gettingInputData = false;
      gettingOutputData = true;
    }
    if (data.indexOf('frame') === 0)
    {
      gettingOutputData = false;
    }
    if (gettingInputData)
    {
      inputData.push(data.toString());
      size = data.match(/\d+x\d+/);
      if (size != null)
      {
        size = size[0].split('x');
        if (this.width == null)
        {
          this.width = parseInt(size[0], 10);
        }
        if (this.height == null)
        {
          return this.height = parseInt(size[1], 10);
        }
      }
    }
  });
  this.mpeg1Muxer.on('ffmpegStderr', (data) =>
  {
    return global.process.stderr.write(data);
  });
  this.mpeg1Muxer.on('exitWithError', () =>
  {
    return this.emit('exitWithError');
  });
  return this;
};

VideoStream.prototype.pipeStreamToSocketServer = function ()
{
  this.wsServer = new ws.Server({
    port: this.wsPort
  });
  this.wsServer.on("connection", (socket, request) =>
  {
    return this.onSocketConnect(socket, request);
  });

  function broadcast(data, opts)
  {
    var results;
    results = [];
    for (let client of this.clients)
    {
      if (client.readyState === 1)
      {
        results.push(client.send(data, opts));
      } else
      {
        results.push(console.log(`Error: Client from remoteAddress ${client.remoteAddress} not connected.`));
      }
    }
    return results;
  }

  this.wsServer.broadcast = broadcast;
  return this.on('camdata', (data) =>
  {
    return this.wsServer.broadcast(data);
  });
};

VideoStream.prototype.onSocketConnect = function (socket, request)
{
  // Your existing code here
  console.log(`${this.name}: New WebSocket Connection (` + this.wsServer.clients.size + " total)");
  socket.remoteAddress = request.connection.remoteAddress;

  // Add this block of code
  socket.on("close", (code, message) =>
  {
    console.log(`${this.name}: Disconnected WebSocket (` + this.wsServer.clients.size + " total)");
    if (this.wsServer.clients.size === 0)
    {
      this.stop();
    }
  });
};

module.exports = VideoStream;
