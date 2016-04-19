/* eslint-disable no-console */
import { readFileSync } from 'fs';
import prettyjson from 'prettyjson';
import { parse } from '../src';
const rawSdp = readFileSync('./test/assets/testSmall.sdp').toString();

parse(rawSdp).then((sdp) => {
  // console.log(prettyjson.render(sdp));
  console.log(JSON.stringify(sdp));
}).catch((err) => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
});
