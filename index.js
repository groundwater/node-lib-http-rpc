var util   = require('util');
var stream = require('stream');

util.inherits(Request, stream.Duplex);
function Request(opts) {
  stream.Duplex.call(this, opts);
}

Request.prototype._write = function _write(chunk, encoding, done) {
  done();
};

Request.prototype._read = function _read(size) {
  this.push('{"a": "A"}');
  this.push(null);
};

function RPC() {

}

RPC.prototype.getRoute = function getRouter(handlers) {

};

RPC.prototype.getClient = function getClient(port, host) {
  return {
    home: function() {
      return new Request();
    }
  };
};

RPC.NewFromInterface = function NewFromInterface(api) {
  return new RPC();
};

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  var deps = {

  };
  return inject(deps);
}

module.exports = function INIT(deps) {
  if (typeof deps === 'object') return inject(deps);
  else if (deps === undefined)  return defaults();
  else                          throw new Error('injection error');
};
