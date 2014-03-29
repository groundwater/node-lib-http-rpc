var http = require('http');
var future = require('lib-stream-future');

function request(opts) {
  var stream = future();
  var req = http.request(opts, function (res) {

    // handle http error codes as error events
    if (res.statusCode >= 400) {
      var error = new Error('RPC Failure', res.statusCode);
      error.code = res.statusCode;

      stream.emit('error', error, res);
    }

    stream.setReadable(res);
  });
  stream.setWritable(req);

  return stream;
}

module.exports = request;
