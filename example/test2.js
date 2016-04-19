/* eslint-disable no-console */
import { readFileSync } from 'fs';
import prettyjson from 'prettyjson';
import { Sdp } from '../src';
const rawSdp = readFileSync('./test/assets/testSmall.sdp').toString();

Sdp.parse(rawSdp).then((sdp) => {
  // console.log(prettyjson.render(sdp.toJson()));
  console.log(JSON.stringify(sdp.toJson(), null, 2));
}).catch((err) => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
});
