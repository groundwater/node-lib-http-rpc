'use strict';

var util   = require('util');
var domain = require('domain');

/*

  Type and Methods

*/

function RPC($) {
  this.$     = $;
  this.api   = null;
  this.iface = null;
}

RPC.prototype.getRouter = function getRouter(handlers) {
  var rpc = this;

  return boundRouter;

  function boundRouter(req, res) {
    return rpc.$.router(rpc, handlers, req, res);
  }
};

RPC.prototype.getClient = function getClient(port, host) {
  var self   = this;
  var $      = this.$;
  var api    = this.api;
  var iface  = this.iface;

  var rqstor = $.Requestor.NewFromServer(port, host);
  var client = {};

  Object.keys(iface).forEach(function (key) {
    client[key] = goGet.bind(iface[key], api, key, rqstor);
  });

  return client;
};

function goGet(api, key, rqstor, params) {
  /*jshint validthis: true */

  var query  = {};
  var opt;

  for (opt in this.options) {
    query[opt] = this.options[opt];
  }

  var opts   = api.request(key, params, query);
  var duplex = rqstor.newDuplex(opts);

  return duplex;
}

/*

  Exceptions

*/

RPC.Error = function RpcError(code, message) {
  Error.call(this, message);

  this.statusCode = code;
};
util.inherits(RPC.Error, Error);

/*

  Constructors

*/

RPC.New = function NewRPC() {
  return new RPC(this);
};

RPC.NewFromInterface = function NewFromInterface(iface) {
  var rpc = this.New();
  var api = this.API.New();

  rpc.api = api;
  rpc.iface = iface;

  this.populateApiFromInterface(api, iface);

  return rpc;
};

/*

  Private Functions

*/

// a context provides all dynamic
// and pluggable properties
// of the rpc request
function Context() {

}

Context.prototype.get = function get(property) {
  return null;
};

Context.prototype.set = function set(property) {

};

function router(rpc, handlers, req, res) {
  var $       = rpc.$;
  var api     = rpc.api;
  var request = api.handle(req.method, req.url);
  var dom     = domain.create();

  // the request handler doesn't exit
  if (!request) {
    res.statusCode = 404;
    res.end();
    return;
  }

  var context = new Context();
  var handle  = request.handle;
  var params  = {};

  var key;
  for(key in request.params) params[key] = request.params[key];
  for(key in request.query)  params[key] = request.query[key];

  var future = $.future();

  future.setWritable(res);
  future.setReadable(req);

  res.setHeader('Transfer-Encoding' , 'chunked');
  res.setHeader('Content-Type'      , 'application/json');

  dom.on('error', function (err) {
    var statusCode = err.statusCode || 500;
    res.statusCode = statusCode;
    res.write(JSON.stringify(err));
    res.end();
  });

  dom.run(function () {
    handlers[handle](future, params, context);
  });
}

function populateApiFromInterface(api, iface) {
  Object.keys(iface).forEach(function (key) {
    api.add(key, iface[key]);
  });
}

/*

  Dependency Injection

*/

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  var deps = {
    Requestor : {
      value: require('lib-stream-http')()
    },
    future: {
      value: require('lib-stream-future')
    },
    API : {
      value: require('lib-http-api')()
    },
    populateApiFromInterface: {
      value: populateApiFromInterface
    },
    router: {
      value: router
    },
  };
  return inject(deps);
}

module.exports = function INIT(deps) {
  if (typeof deps === 'object') return inject(deps);
  else if (deps === undefined)  return defaults();
  else                          throw new Error('injection error');
};
