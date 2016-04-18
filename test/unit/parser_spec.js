/* eslint max-nested-callbacks: [0] */
import parser from '../../src/grammar.js';
import { readAsset } from '../helpers/file_helpers.js';

describe('Parser', function() {
  let sdp;

  before(function(done) {
    readAsset('test.sdp').then((rawSdp) => {
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
    return sdp.media[mediaIndex].attrs.filter((l) => l.type === type).map((attr) => {
      return attr.value;
    });
  }

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

  it('parses ice-lite', function() {
    expect(sdp.attrs[2]).to.eql({
      type: 'ice-lite',
    });
  });

  it('parses ice-mismatch', function() {
    expect(sdp.attrs[3]).to.eql({
      type: 'ice-mismatch',
    });
  });

  it('parses ice-options', function() {
    expect(sdp.attrs[4]).to.eql({
      type: 'ice-options',
      value: ['trickle'],
    });
  });

  it('parses ice-ufrag', function() {
    expect(sdp.attrs[5]).to.eql({
      type: 'ice-ufrag',
      value: '4dS4NkAMrAgKccxA',
    });
  });

  it('parses ice-pwd', function() {
    expect(sdp.attrs[6]).to.eql({
      type: 'ice-pwd',
      value: 'VC9qlvEt54AXvF91TEYIdNe+',
    });
  });

  describe('group attribute', function() {
    it('parses the BUNDLE grouping', function() {
      const group = sdp.attrs[0];
      expect(group).to.eql({
        type: 'group',
        value: {
          semantics: 'BUNDLE',
          idTags: ['audio', 'video'],
        },
      });
    });

    it('parses the Lip Synchronization (LS) grouping');
    it('parses the Flow Identification (FID) grouping');
  });

  describe('media level attrs', function() {
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
        value: {
          hashFunction: 'sha-256',
          fingerprint: '5C:A0:97:6E:70:68:12:87:8F:31:D7:C4:66:26:18:99:38:09:C1:' +
                       '7B:AE:AE:70:8D:31:08:7D:2D:AF:53:02:3A',
        },
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
        value: {
          port: 9,
          netType: 'IN',
          addrType: 'IP4',
          address: '0.0.0.0',
        },
      });
    });

    it('parses the extmap attrs', function() {
      const [ext1, ext2, ext3] = getAllMediaAttr(1, 'extmap');

      expect(ext1.value).to.equal('2');
      expect(ext1.extension).to.equal('urn:ietf:params:rtp-hdrext:toffset');
      expect(ext2.value).to.equal('3');
      expect(ext2.extension)
        .to.equal('http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time');
      expect(ext3.value).to.equal('4');
      expect(ext3.extension).to.equal('urn:3gpp:video-orientation');
    });

    it('parses the ssrc attrs', function() {
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

    it('parses the ssrc-group attrs', function() {
      const ssrcGroup = getMediaAttr(1, 'ssrc-group').value;
      expect(ssrcGroup.semantics).to.equal('FID');
      expect(ssrcGroup.ids).to.eql([750257294, 3339118420]);
    });

    it('parses the rtpmap attrs', function() {
      const g722 = getAllMediaAttr(0, 'rtpmap')
                        .find((r) => r.encodingName === 'G722');

      expect(g722.clockRate).to.equal(8000);
      expect(g722.format).to.equal('9');
      expect(g722.encodingParams).to.undefined;
    });

    it('parses the rtpmap attrs with encoding parameters', function() {
      const opus = getAllMediaAttr(0, 'rtpmap')
                          .find((r) => r.encodingName === 'opus');
      expect(opus.clockRate).to.equal(48000);
      expect(opus.format).to.equal('111');
      expect(opus.encodingParams).to.equal('2');
    });

    it('parses the rtcp-fb attrs', function() {
      const nackFb = getAllMediaAttr(1, 'rtcp-fb')
                          .find((r) => r.feedback.type === 'nack');
      expect(nackFb.format).to.equal('100');
      expect(nackFb.feedback.params).to.be.undefined;
    });

    it('parses the rtcp-fb attrs that have parameters', function() {
      const ccmFb = getAllMediaAttr(1, 'rtcp-fb')
                          .find((r) => r.feedback.type === 'ccm');
      expect(ccmFb.format).to.equal('100');
      expect(ccmFb.feedback.params).to.eql(['fir']);
    });

    describe('candidate', function() {

    });

    it('parses ice-options', function() {
      const iceOptions = getMediaAttr(1, 'ice-options');
      expect(iceOptions).to.eql({
        type: 'ice-options',
        value: ['interpretiveDance'],
      });
    });

    it('parses ice-ufrag', function() {
      const iceUfrag = getMediaAttr(1, 'ice-ufrag');
      expect(iceUfrag).to.eql({
        type: 'ice-ufrag',
        value: '4dS4NkAMrAgKccxA',
      });
    });

    it('parses ice-pwd', function() {
      const icePwd = getMediaAttr(1, 'ice-pwd');
      expect(icePwd).to.eql({
        type: 'ice-pwd',
        value: 'VC9qlvEt54AXvF91TEYIdNe+',
      });
    });

    it('maxptime', function() {
      expect(getMediaAttr(0, 'maxptime')).to.eql({
        type: 'maxptime',
        value: 60,
      });
    });

    it('rtcp-mux', function() {
      expect(getMediaAttr(1, 'rtcp-mux')).to.eql({
        type: 'rtcp-mux',
      });
    });

    it('parses remote-candidates', function() {
      const remoteCandidates = getAllMediaAttr(0, 'remote-candidates');
      expect(remoteCandidates[0]).to.eql([{
        componentId: '1',
        address: '10.104.0.68',
        port: 50025,
      }]);

      expect(remoteCandidates[1]).to.eql([{
        componentId: '1',
        address: '213.199.141.81',
        port: 51721,
      }, {
        componentId: '2',
        address: '213.199.141.81',
        port: 58975,
      }]);
    });

    it('parses the fmtp line', function() {
      const fmtp = getMediaAttr(1, 'fmtp');
      expect(fmtp).to.eql({
        type: 'fmtp',
        value: {
          format: '96',
          params: ['apt=100'],
        },
      });
    });

    it('parses previous-ssrc', function() {
      const previousSSRC = getAllMediaAttr(1, 'ssrc')
              .find((s) => s.attribute && s.attribute.type === 'previous-ssrc');

      expect(previousSSRC).to.eql({
        id: 3339118420,
        attribute: {
          type: 'previous-ssrc',
          value: '1234567890',
        },
      });
    });

    describe('encryption key line', function() {
      it('parses cleartext keys', function() {
        expect(sdp.media[0].key).to.equal('clear:manhole cover');
      });

      it('parses base64 encoded keys', function() {
        expect(sdp.media[1].key).to.equal('base64:bhdsfsd78f7dssdfssfsd7sdfssa');
      });

      it('parses uri location keys', function() {
        expect(sdp.media[2].key).to.equal('uri:https://example.com');
      });

      it('parses a request to prompt for user authentication', function() {
        expect(sdp.media[3].key).to.equal('prompt');
      });
    });

    it('maintains total order of lines');
  });
});
