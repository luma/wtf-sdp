/* eslint max-nested-callbacks: [0] */
/* global before */
import path from 'path';
import fs from 'fs';
import PEG from 'pegjs';
import Bluebird from 'bluebird';

const readFile = Bluebird.promisify(fs.readFile);

describe('Parser', function() {
  const grammarPath = path.resolve(__dirname, '../../src/sdp.pegjs');
  const testSdp = path.resolve(__dirname, '../assets/test.sdp');
  let rawSdp, sdp;

  before(function(done) {
    Promise.all([
      readFile(grammarPath),
      readFile(testSdp),
    ]).then(([grammar, _rawSdp]) => {
      const parser = PEG.buildParser(grammar.toString());
      rawSdp = _rawSdp.toString();
      sdp = parser.parse(rawSdp);
      done();
    }).catch((err) => {
      throw err;
    });
  });

  function getMediaAttr(mediaIndex, type) {
    return sdp.media[mediaIndex].attrs.find((l) => l.type === type);
  }

  function getAllMediaAttr(mediaIndex, type) {
    return sdp.media[mediaIndex].attrs.filter((l) => l.type === type);
  }


  it('maintains total order of lines');

  it('parses the protocol version', function() {
    // We're targetting version 0
    expect(sdp.version).to.equal(0);
  });

  describe('origin', function() {
    it('parses the session id', function() {
      expect(sdp.origin.session.id).to.equal(3255555237358417400);
    });

    it('parses the session version', function() {
      expect(sdp.origin.session.version).to.equal(2);
    });

    it('parses the net type', function() {
      expect(sdp.origin.netType).to.equal('IN');
    });

    it('parses the addressType', function() {
      expect(sdp.origin.addressType).to.equal('IP4');
    });

    it('parses the unicast address', function() {
      expect(sdp.origin.address).to.equal('127.0.0.1');
    });

    it('parses the username', function() {
      expect(sdp.origin.username).to.equal('-');
    });
  });

  it('parses the session name', function() {
    expect(sdp.sessionName).to.equal('Test SDP');
  });

  it('parses the info', function() {
    expect(sdp.info).to.equal('A SDP for testing purposes');
  });

  it('parses the emails', function() {
    expect(sdp.emails).to.eql([
      'test@example.com (John Doe)',
      'test2@example.com (John Doe2)',
    ]);
  });

  it('parses the phone numbers', function() {
    expect(sdp.phones).to.eql([
      '+44-171-380-7777',
      '+44-171-491-8888',
    ]);
  });

  describe('connection', function() {
    it('parses the net type', function() {
      expect(sdp.connection.netType).to.equal('IN');
    });

    it('parses the address type', function() {
      expect(sdp.connection.addressType).to.equal('IP4');
    });

    it('parses the address', function() {
      expect(sdp.connection.address).to.equal('224.2.17.12/127');
    });
  });

  describe('bandwidths', function() {
    it('parses Conference Total (CT) bandwidth', function() {
      expect(sdp.bandwidths[0].type).to.equal('CT');
      expect(sdp.bandwidths[0].value).to.equal(32);
    });

    it('parses Application-Specific (AS) Maximum bandwidth', function() {
      expect(sdp.bandwidths[1].type).to.equal('AS');
      expect(sdp.bandwidths[1].value).to.equal(64);
    });

    it('parses custom or experiemental bandwidth modifiers', function() {
      expect(sdp.bandwidths[2].type).to.equal('X-YZ');
      expect(sdp.bandwidths[2].value).to.equal(128);
    });
  });

  describe('times', function() {
    it('parses the start time', function() {
      expect(sdp.times[0].start).to.equal('3034423619');
    });

    it('parses the stop time', function() {
      expect(sdp.times[0].stop).to.equal('3042462419');
    });
  });

  describe('time repeats', function() {
    it('allows multiple repeats for each time', function() {
      expect(sdp.times[0].repeats).to.be.a('array');
      expect(sdp.times[0].repeats.length).to.equal(2);
    });

    it('parses raw repeat numbers', function() {
      const repeat = sdp.times[0].repeats[0];
      expect(repeat).to.eql({
        interval: 604800,
        activeDuration: 3600,
        offsets: [0, 90000],
      });
    });

    it('parses repeats using shorthand units', function() {
      const repeat = sdp.times[0].repeats[1];
      expect(repeat).to.eql({
        interval: '7d',
        activeDuration: '1h',
        offsets: [0, '25h'],
      });
    });
  });

  describe('group attribute', function() {
    it('parses the BUNDLE grouping', function() {
      const group = sdp.attributes[0];

      expect(group).to.eql({
        type: 'group',
        semantics: 'BUNDLE',
        idTags: ['audio', 'video'],
      });
    });

    it('parses the Lip Synchronization (LS) grouping');
    it('parses the Flow Identification (FID) grouping');
  });

  describe('encryption keys', function() {
    it('parses a clear key');
    it('parses a base64 encoded key');
    it('parses a URI location of the key');
    it('parses a request to prompt for user authentication');
  });

  describe('media level attributes', function() {
    it('parses the type', function() {
      expect(sdp.media[0].type).to.equal('audio');
      expect(sdp.media[1].type).to.equal('video');
    });

    it('parses the protocol', function() {
      expect(sdp.media[0].protocol).to.equal('RTP/SAVPF');
      expect(sdp.media[1].protocol).to.equal('RTP/SAVPF');
    });

    it('parses the supported formats', function() {
      expect(sdp.media[0].formats).to.eql(['111', '103', '104', '9', '0', '8', '126']);
      expect(sdp.media[1].formats).to.eql(['100', '101', '116', '117', '96', '97', '98']);
    });

    it('parses the port', function() {
      expect(sdp.media[0].port).to.equal(9);
      expect(sdp.media[1].port).to.equal(9);
    });

    it('parses the Media Stream Identification (MID) attribute and groups it with ' +
    'it\'s media section', function() {
      ['audio', 'video', 'video2', 'audio2'].forEach((mid, i) => {
        const midLine = getMediaAttr(i, 'mid');
        expect(midLine).to.not.be.undefined;
        expect(midLine.value).to.equal(mid);
      });
    });

    describe('Direction', function() {
      it('parses the "sendonly" direction', function() {
        const directionLine = getMediaAttr(1, 'direction');
        expect(directionLine.value).to.equal('sendonly');
      });

      it('parses the "sendrecv" direction', function() {
        const directionLine = getMediaAttr(0, 'direction');
        expect(directionLine.value).to.equal('sendrecv');
      });

      it('parses the "inactive" direction', function() {
        const directionLine = getMediaAttr(2, 'direction');
        expect(directionLine.value).to.equal('inactive');
      });

      it('parses the "recvonly" direction', function() {
        const directionLine = getMediaAttr(3, 'direction');
        expect(directionLine.value).to.equal('recvonly');
      });
    });

    it('parses the fingerprint', function() {
      const fingerprint = getMediaAttr(0, 'fingerprint');

      expect(fingerprint).to.eql({
        type: 'fingerprint',
        hashFunction: 'sha-256',
        fingerprint: '5C:A0:97:6E:70:68:12:87:8F:31:D7:C4:66:26:18:99:38:09:C1:' +
                     '7B:AE:AE:70:8D:31:08:7D:2D:AF:53:02:3A',
      });
    });

    describe('connection', function() {
      it('parses the net type', function() {
        expect(sdp.media[0].connections[0].netType).to.equal('IN');
      });

      it('parses the address type', function() {
        expect(sdp.media[0].connections[0].addressType).to.equal('IP4');
      });

      it('parses the address', function() {
        expect(sdp.media[0].connections[0].address).to.equal('0.0.0.0');
      });
    });

    it('parses the rtcp attribute', function() {
      const rtcp = getMediaAttr(0, 'rtcp');
      expect(rtcp).to.eql({
        type: 'rtcp',
        port: 9,
        netType: 'IN',
        addrType: 'IP4',
        address: '0.0.0.0',
      });
    });

    it('parses the extmap attributes', function() {
      const extMappings = getAllMediaAttr(1, 'extmap');

      expect(extMappings[0].value).to.equal('2');
      expect(extMappings[0].extension).to.equal('urn:ietf:params:rtp-hdrext:toffset');
      expect(extMappings[1].value).to.equal('3');
      expect(extMappings[1].extension)
        .to.equal('http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time');
      expect(extMappings[2].value).to.equal('4');
      expect(extMappings[2].extension).to.equal('urn:3gpp:video-orientation');
    });

    it('parses the ssrc attributes', function() {
      const ssrcs = getAllMediaAttr(2, 'ssrc');
      expect(ssrcs[0].id).to.equal(750257294);
      expect(ssrcs[0].attribute).to.eql({
        type: 'cname',
        value: 'qNn0vt04pMSU+wOo',
      });
    });

    it('parses the ssrc attribute with whitespace in their attr values', function() {
      const ssrcs = getAllMediaAttr(2, 'ssrc');
      expect(ssrcs[1].id).to.equal(750257294);
      expect(ssrcs[1].attribute).to.eql({
        type: 'msid',
        value: 'y2Pkbz4KgqrQz9Rx1WM91xAOsAOYAYZNcucu 85c70629-98cd-4ce4-8508-b9374c7baa6d',
      });
    });

    it('parses the ssrc-group attributes', function() {
      const ssrcGroup = getMediaAttr(1, 'ssrc-group');
      expect(ssrcGroup.semantics).to.equal('FID');
      expect(ssrcGroup.ids).to.eql([750257294, 3339118420]);
    });

    it('parses the rtpmap attributes', function() {
      const g722 = getAllMediaAttr(0, 'rtpmap')
                        .find((r) => r.encodingName === 'G722');

      expect(g722.clockRate).to.equal(8000);
      expect(g722.payloadType).to.equal('9');
      expect(g722.encodingParams).to.undefined;
    });

    it('parses the rtpmap attributes with encoding parameters', function() {
      const opus = getAllMediaAttr(0, 'rtpmap')
                          .find((r) => r.encodingName === 'opus');
      expect(opus.clockRate).to.equal(48000);
      expect(opus.payloadType).to.equal('111');
      expect(opus.encodingParams).to.equal('2');
    });

    it('parses the rtcp-fb attributes', function() {
      const nackFb = getAllMediaAttr(1, 'rtcp-fb')
                          .find((r) => r.feedback.type === 'nack');
      expect(nackFb.format).to.equal('100');
      expect(nackFb.feedback.params.length).to.equal(0);
    });

    it('parses the rtcp-fb attributes that have parameters', function() {
      const ccmFb = getAllMediaAttr(1, 'rtcp-fb')
                          .find((r) => r.feedback.type === 'ccm');
      expect(ccmFb.format).to.equal('100');
      expect(ccmFb.feedback.params).to.eql(['fir']);
    });

    describe('candidate', function() {

    });

    it('parses ice-pwd');
    it('parses ice-ufrag');
  });
});
