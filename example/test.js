const fs = require('fs');
const prettyjson = require('prettyjson');
const Tracer = require('pegjs-backtrace');
const parser = require('../lib').sdpParser;
const rawSdp = fs.readFileSync('./example/test.sdp').toString();
const tracer = new Tracer(rawSdp);
var sdp;

try {
  sdp = parser.parse(rawSdp, { tracer: tracer });
} catch (e) {
  console.error(tracer.getBacktraceString());
  throw e;
}

console.log(prettyjson.render(sdp));
