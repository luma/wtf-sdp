/* eslint max-nested-callbacks: [0] */
import Sdp from '../../src/sdp.js';
import { ParserError } from '../../src/parse.js';
import { readAsset, readJsonAsset } from '../helpers/file_helpers.js';

describe('Sdp', function() {
  let sdp, rawJsonSdp;

  beforeEach(function() {
    return readJsonAsset('test_sdp.json').then((sdpJson) => {
      rawJsonSdp = sdpJson;
      sdp = new Sdp(sdpJson);
    });
  });

  it('exposes the raw lines', function() {
    expect(sdp.raw).to.eql(rawJsonSdp);
  });

  describe('Sdp.parse', function() {
    it('resolves the promise when parsing valid SDP', function() {
      return readAsset('test.sdp').then((rawSdp) => {
        return Sdp.parse(rawSdp);
      }).then((_sdp) => {
        return expect(_sdp.raw).to.eql(rawJsonSdp);
      });
    });

    it('rejects the promise when parsing invalid SDP', function() {
      return Sdp.parse('I\'m like totally SDP!').should.be.rejectedWith(ParserError);
    });
  });

  it('has a version', function() {
    expect(sdp.version).to.equal(0);
  });

  it('has origin', function() {
    expect(sdp.origin).to.eql({
      username: '-',
      session: { id: 3255555237358417400, version: 2 },
      netType: 'IN',
      addressType: 'IP4',
      address: '127.0.0.1',
    });
  });

  it('has times', function() {
    expect(sdp.times).to.eql([{
      start: '3034423619',
      stop: '3042462419',
      repeats: [{
        interval: 604800,
        activeDuration: 3600,
        offsets: [0, 90000],
      }, {
        interval: '7d',
        activeDuration: '1h',
        offsets: [0, '25h'],
      }],
    }]);
  });

  it('has a session name', function() {
    expect(sdp.sessionName).to.equal('Test SDP');
  });


  it('has info', function() {
    expect(sdp.info).to.equal('A SDP for testing purposes');
  });

  it('has uri', function() {
    expect(sdp.uri).to.equal('http://www.example.com');
  });

  it('has emails', function() {
    expect(sdp.emails).to.eql([
      'test@example.com (John Doe)',
      'test2@example.com (John Doe2)',
    ]);
  });

  it('has phones', function() {
    expect(sdp.phones).to.eql([
      '+44-171-380-7777',
      '+44-171-491-8888',
    ]);
  });

  it('has groups', function() {
    expect(sdp.groups.length).to.equal(1);
    const { semantics, ids } = sdp.groups[0];
    expect(semantics).to.equal('BUNDLE');
    expect(ids).to.eql(['audio', 'video']);
  });

  it('has connection', function() {
    expect(sdp.connection).to.eql({
      netType: 'IN',
      addressType: 'IP4',
      address: '224.2.17.12/127',
    });
  });

  it('has the ICE details', function() {
    expect(sdp.ice).to.eql({
      pwd: 'VC9qlvEt54AXvF91TEYIdNe+',
      ufrag: '4dS4NkAMrAgKccxA',
      options: ['trickle'],
      lite: true,
      mismatch: true,
    });
  });

  it('serialises to JSON correctly');
});
