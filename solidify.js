var util = require('util');
var stream = require('stream');

util.inherits(Solidify, stream.Writable);
function Solidify(opts) {
  this.buffer = [];
  stream.Writable.call(this, opts);
}

Solidify.prototype.json = function (callback) {
  var buffer = this.buffer;
  this.on('finish', function CALLBACK_JSON() {
    try {
      var _json = buffer.map(function (x) { return x.toString() }).join('');
      callback(null, JSON.parse(_json));
    } catch (e) {
      callback(e);
    }
  });
};

Solidify.prototype._write = function (chunk, encoding, next) {
  this.buffer.push(chunk);
  next();
};

function solidify() {
  return new Solidify();
}

module.exports  = solidify;
