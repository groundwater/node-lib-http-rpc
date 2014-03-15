var http = require('http');
var url  = require('url');

function RPC(iface) {
  this.iface = iface;
}

RPC.prototype.getRouter = function (handlers) {
  var routes = {};

  Object.keys(this.iface).forEach(function (method) {
    var route = this.iface[method].route;
    var methd = this.iface[method].method;

    if (!routes[methd]) routes[methd] = {};

    routes[methd][route] = handlers[method];
  }, this);

  return function (req, res) {
    var handler = routes[req.method][req.url];

    var buffer = [];
    req.on('data', function (chunk) {
      buffer.push(chunk);
    })

    req.on('end', function () {
      var body;
      try {
        body = JSON.parse(buffer.join(''));
      } catch(e) {
        body = null;
      }

      handler(null, body, function (err, data) {
        if (data) res.write(JSON.stringify(data));
        res.end();
      });
    })
  };
};

RPC.prototype.getClient = function (host, port) {
  var out   = {};
  var iface = this.iface;

  Object.keys(this.iface).forEach(function (method) {
    var route = this.iface[method].route;
    out[method] = function (opts, body, callback) {
      var opts = {
        host   : host,
        port   : port,
        path   : route,
        method : iface[method].method
      };
      var req = http.request(opts, function (res) {
        var buf = [];
        res.on('data', function (chunk) {
          buf.push(chunk);
        });
        res.on('end', function () {
          var json;
          try {
            json = JSON.parse(buf.join(''));
          } catch(e) {
            json = null;
          }
          callback(null, json);
        });
      })
      if (body) req.write(JSON.stringify(body));
      req.end();
    }
  }, this);

  return out;
};

module.exports = RPC;
