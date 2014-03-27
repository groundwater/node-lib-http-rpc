var fs = require('fs')
var http   = require('http');
var util   = require('util');
var stream = require('stream');
var liquify = require('./liquify');

util.inherits(Channel, stream.Duplex);
function Channel($, opts) {
  stream.Duplex.call(this, opts);
  var self = this;

  this.writable = null;
  this.w_buffer = null;
  this.w_callbk = null;
  this.w_encodn = null;

  this.readable = null;

  this.$ = $;
}

Channel.prototype._write = function _write(chunk, encoding, callback) {
  if (this.writable) {
    this.writable.write(chunk, encoding, callback);
  } else {
    this.w_buffer = chunk;
    this.w_encodn = encoding;
    this.w_callbk = callback;
  }
};

Channel.prototype._read = function _read(size) {};

Channel.prototype.addSink     = 
Channel.prototype.addWritable = function (writable) {
  this.writable = writable;
  this.on('finish', function () {
    writable.end();
  })
  if (this.w_buffer) {
    this.writable.write(this.w_buffer, this.w_encodn, this.w_callbk);
  }
};

Channel.prototype.addSource   =
Channel.prototype.addReadable = function (readable) {
  var self = this;
  readable.on('data', function (data) {
    self.push(data.toString());
  });
  readable.on('end', function () {
    self.push(null);
  })
};

module.exports.Channel = Channel;
