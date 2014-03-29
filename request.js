var http = require('http');
var future = require('lib-stream-future');

function request(opts) {
  var stream = future();
  var req = http.request(opts, function (res) {
    stream.setReadable(res);
  });
  stream.setWritable(req);

  return stream;
}

module.exports = request;
