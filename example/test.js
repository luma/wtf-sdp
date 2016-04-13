const fs = require('fs');
const prettyjson = require('prettyjson');
const parse = require('../lib').parse;
const rawSdp = fs.readFileSync('./example/test.sdp').toString();

parse(rawSdp).then((sdp) => {
  console.log(prettyjson.render(sdp));
  // console.log(JSON.stringify(sdp));
}).catch((err) => {
  console.error(err.message);
  console.error(err.backtrace);
});
