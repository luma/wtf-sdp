import { default as parse, ParserError } from '../../src/parse.js';
import { readAsset } from '../helpers/file_helpers.js';

describe('Parse', function() {
  it('resolves with the parsed sdp when the input is valid SDP', function() {
    return Promise.all([
      readAsset('test.sdp'),
      readAsset('test_sdp.json'),
    ]).then(([rawSdp, expectedJson]) => {
      return parse(rawSdp).should.become(JSON.parse(expectedJson));
    });
  });

  it('rejects it is called without sdp', function() {
    return parse().should.be.rejectedWith(ParserError, 'There was no SDP to parse');
  });

  it('rejects when the input is not valid SDP', function() {
    return parse('I\'m like totally SDP!').should.be.rejectedWith(ParserError);
  });
});
