const fs = require('fs');
const prettyjson = require('prettyjson');
const parser = require('../lib').sdpParser;
const sdp = parser.parse(fs.readFileSync('./example/test.sdp').toString());
console.log(prettyjson.render(sdp));
