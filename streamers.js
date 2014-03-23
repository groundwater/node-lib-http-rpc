var util = require('util');
var stream = require('stream');

util.inherits(JSONStream, stream.Readable);
function JSONStream(obj, opts) {
  this.json = JSON.stringify(obj);
  stream.Readable.call(this, opts);
}

JSONStream.prototype._read = function _read(size) {
  this.push(this.json);
  this.push(null);
}

function liquify(object) {
  return new JSONStream(object);
};

util.inherits(ObjectStream, stream.Writable);
function ObjectStream(opts) {
  this.buffer = [];
  stream.Writable.call(this, opts);

}

ObjectStream.prototype.json = function (callback) {
  var buffer = this.buffer;
  this.on('finish', function CALLBACK_JSON() {
    try {
      var _json = this.buffer.map(function (x) { return x.toString() }).join('');
      callback(null, JSON.parse(_json));
    } catch (e) {
      callback(e);
    }
  });
};

ObjectStream.prototype._write = function (chunk, encoding, next) {
  this.buffer.push(chunk);
  next();
};

function solidify() {
  return new ObjectStream();
}

module.exports.liquify  = liquify;
module.exports.solidify = solidify;
