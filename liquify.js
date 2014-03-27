var util = require('util');
var stream = require('stream');

util.inherits(Liquify, stream.Readable);
function Liquify(obj, opts) {
  this.json = JSON.stringify(obj);
  stream.Readable.call(this, opts);
}

Liquify.prototype._read = function _read(size) {
  this.push(this.json);
  this.push(null);
}

function liquify(object) {
  return new Liquify(object);
};

module.exports  = liquify;
