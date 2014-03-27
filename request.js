var util   = require('util');
var stream = require('stream');

util.inherits(Request, stream.Duplex);
function Request(opts) {
  stream.Duplex.call(this, opts);

  var self = this;

  this.buffer = [];
  this.on('finish', function () {
    self.push(null);
  });
}

Request.prototype._write = function _write(chunk, encoding, done) {
  this.buffer.push(chunk);
  this.__drain();
  done();
};

Request.prototype.__drain = function () {
  while (this.buffer.length > 0) {
    var x = this.buffer.shift();
    this.push(x);
  }
};

Request.prototype._read = function _read(size) {
  this.__drain();
};

module.exports = Request;
