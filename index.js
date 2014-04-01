'use strict';

var util   = require('util');
var domain = require('domain');

/*

  Data Structures

*/

// a context provides all dynamic and pluggable properties of the rpc request
function Context() {
  this._props = {};
}

function RPC($) {
  this.$     = $;
  this.api   = null;
  this.iface = null;
}

/*

  Public Methods

*/

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


Context.prototype.get = function get(property) {
  return this._props[property];
};

Context.prototype.set = function set(property, content) {
  this._props[property] = content;
};

/*

  Exceptions

*/

RPC.Error = function RpcError(code, message) {
  Error.call(this, message);

  this.statusCode = code;
};
util.inherits(RPC.Error, Error);

RPC.NotFoundError = function NotFoundError() {
  Error.apply(this, arguments);

  this.statusCode = 404;
};
util.inherits(RPC.NotFoundError, RPC.Error);

RPC.BadRequestError = function BadRequestError() {
  Error.apply(this, arguments);

  this.statusCode = 400;
};
util.inherits(RPC.BadRequestError, RPC.Error);

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

function populateApiFromInterface(api, iface) {
  Object.keys(iface).forEach(function (key) {
    api.add(key, iface[key]);
  });
}


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
    var statusCode = err.statusCode;

    //
    if (!statusCode) throw err;

    res.statusCode = statusCode;
    res.write(JSON.stringify(err));
    res.end();
  });

  dom.run(function () {
    handlers[handle](future, params, context);
  });
}

/*

  Dependency Injection

*/

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  return {
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
}

module.exports = function INIT(deps) {
  return inject(deps || defaults());
};
