import { readFileSync } from 'fs';
import prettyjson from 'prettyjson';
import { Sdp } from '../src';
const rawSdp = readFileSync('./example/test.sdp').toString();

Sdp.parse(rawSdp).then((sdp) => {
  console.log(prettyjson.render(sdp));
  // console.log(JSON.stringify(sdp.media[1].payloads, null, 2));
}).catch((err) => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
});
