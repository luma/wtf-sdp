const fs = require('fs');
const prettyjson = require('prettyjson');
const Sdp = require('../lib').Sdp;
const rawSdp = fs.readFileSync('./example/test.sdp').toString();

Sdp.parse(rawSdp).then((sdp) => {
  console.log(prettyjson.render(sdp));
  // console.log(JSON.stringify(sdp.media[1].payloads, null, 2));
}).catch((err) => {
  console.error(err.message);
  console.error(err.backtrace);
});
