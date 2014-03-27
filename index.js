"use strict";

function RPC($) {
  this.$ = $;
}

RPC.prototype.getRoute = function getRouter(handlers) {

};

RPC.prototype.getClient = function getClient(port, host) {
  var $ = this.$;

  return {
    home: function() {
      return $.NewRequest();
    }
  };
};

RPC.NewFromInterface = function NewFromInterface(api) {
  return new RPC(this);
};

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  var Request = require('./request');
  var deps = {
    NewRequest : {
      value: function NewRequest(opts) {
        return new Request(opts);
      }
    }
  };
  return inject(deps);
}

module.exports = function INIT(deps) {
  if (typeof deps === 'object') return inject(deps);
  else if (deps === undefined)  return defaults();
  else                          throw new Error('injection error');
};
