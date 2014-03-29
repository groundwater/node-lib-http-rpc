"use strict";

function RPC($) {
  this.$ = $;
}

RPC.prototype.getRouter = function getRouter(handlers) {
  var $ = this.$;
  var api = this.api;

  return router;

  function router(req, res) {
    var request = api.handle(req.method, req.url);

    var handle = request.handle;
    var params = request.params;
    var query  = request.query;

    var future = $.future();

    future.setWritable(res);
    future.setReadable(req);

    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader("Content-Type", "application/json");

    handlers[handle](future, params, query, req, res);
  }
};

RPC.prototype.getClient = function getClient(port, host) {
  var $ = this.$;
  var api = this.api;

  return {
    home: function (params, query) {
      var opts = api.request('home', params, query);

      opts.host = host;
      opts.port = port;
      opts.headers = {
        "Transfer-Encoding": "chunked",
        "Content-Type": "application/json",
      };

      var req = $.NewRequest(opts);

      return req;
    }
  }
};

RPC.NewFromAPI = function NewFromInterface(api) {
  var rpc =  new RPC(this);

  rpc.api = api;

  return rpc;
};

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  var deps = {
    NewRequest : {
      value: require('./request.js')
    },
    future: {
      value: require('lib-stream-future')
    }
  };
  return inject(deps);
}

module.exports = function INIT(deps) {
  if (typeof deps === 'object') return inject(deps);
  else if (deps === undefined)  return defaults();
  else                          throw new Error('injection error');
};
