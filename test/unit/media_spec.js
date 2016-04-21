import Media from '../../src/media.js';
import mapToObject from '../../src/util/map_to_object.js';
import { readJsonAsset } from '../helpers/file_helpers.js';

describe('Media', function() {
  let video;

  beforeEach(function() {
    return readJsonAsset('test_sdp.json').then((sdpJson) => {
      video = new Media(sdpJson.media[1]);
    });
  });

  it('has an id', function() {
    expect(video.id).to.equal('video');
  });

  it('has a type', function() {
    expect(video.type).to.equal('video');
  });

  it('has a port', function() {
    expect(video.port).to.equal(9);
  });

  it('has a protocol', function() {
    expect(video.protocol).to.equal('RTP/SAVPF');
  });

  it('has connections', function() {
    expect(video.connections).to.eql([{
      netType: 'IN',
      addressType: 'IP4',
      address: '0.0.0.0',
    }]);
  });

  it('has the ICE details', function() {
    expect(video.ice).to.eql({
      pwd: 'VC9qlvEt54AXvF91TEYIdNe+',
      ufrag: '4dS4NkAMrAgKccxA',
      options: ['interpretiveDance'],
    });
  });

  it('indicates the direction of the media', function() {
    expect(video.direction).to.equal('sendonly');
  });

  it('has a fingerprint', function() {
    expect(video.fingerprint).to.eql({
      hashFunction: 'sha-256',
      fingerprint: '5C:A0:97:6E:70:68:12:87:8F:31:D7:C4:66:26:18:99' +
                  ':38:09:C1:7B:AE:AE:70:8D:31:08:7D:2D:AF:53:02:3A',
    });
  });

  it('has the supported extensions', function() {
    return readJsonAsset('extensions.json').then((extensions) => {
      expect(mapToObject(video.extensions)).to.eql(extensions);
    });
  });

  it('caches the extensions data after it has been collated', function() {
    const extensions = video.extensions;
    expect(video.extensions).to.equal(extensions);
  });

  it('has the ssrcs', function() {
    return readJsonAsset('ssrcs.json').then((ssrcs) => {
      expect(mapToObject(video.ssrcs)).to.eql(ssrcs);
    });
  });

  it('caches the ssrcs data after it has been collated', function() {
    const ssrcs = video.ssrcs;
    expect(video.ssrcs).to.equal(ssrcs);
  });

  it('has the candidates', function() {
    return readJsonAsset('candidates.json').then((candidates) => {
      expect(video.candidates).to.eql(candidates);
    });
  });

  describe('payloads', function() {
    let vp8;

    beforeEach(function() {
      vp8 = video.payloads.get('100');
    });

    it('includes the rtpmap codec info', function() {
      expect(vp8.encodingName).to.equal('VP8');
      expect(vp8.clockRate).to.equal(90000);
      expect(vp8.id).to.equal('100');
    });

    it('includes all the rtcp feedback', function() {
      expect(vp8.feedback).to.eql([
        { type: 'ccm', params: ['fir'] },
        { type: 'nack' },
        { type: 'nack', params: ['pli'] },
        { type: 'goog-remb' },
        { type: 'transport-cc' },
      ]);
    });

    it('includes all the format params', function() {
      expect(vp8.params).to.eql(['apt=116']);
    });

    it('caches the payload data after it has been collated', function() {
      expect(video.payloads.get('100')).to.equal(vp8);
    });
  });
});
