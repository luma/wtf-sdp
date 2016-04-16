import Media from '../../src/media.js';
import { readJsonAsset } from '../helpers/file_helpers.js';

describe('Media', function() {
  let videoMedia;

  beforeEach(function() {
    return readJsonAsset('test_sdp.json').then((sdpJson) => {
      videoMedia = new Media(sdpJson.media[1]);
    });
  });

  it('has an id', function() {
    expect(videoMedia.id).to.equal('video');
  });

  it('has a type', function() {
    expect(videoMedia.type).to.equal('video');
  });

  it('has a port', function() {
    expect(videoMedia.port).to.equal(9);
  });

  it('has a protocol', function() {
    expect(videoMedia.protocol).to.equal('RTP/SAVPF');
  });

  it('has connections', function() {
    expect(videoMedia.connections).to.eql([{
      netType: 'IN',
      addressType: 'IP4',
      address: '0.0.0.0',
    }]);
  });

  it('has the ICE details', function() {
    expect(videoMedia.ice).to.eql({
      pwd: 'VC9qlvEt54AXvF91TEYIdNe+',
      ufrag: '4dS4NkAMrAgKccxA',
      options: ['interpretiveDance'],
    });
  });

  it('indicates the direction of the media', function() {
    expect(videoMedia.direction).to.equal('sendonly');
  });

  it('has a fingerprint', function() {
    expect(videoMedia.fingerprint).to.eql({
      hashFunction: 'sha-256',
      fingerprint: '5C:A0:97:6E:70:68:12:87:8F:31:D7:C4:66:26:18:99' +
                  ':38:09:C1:7B:AE:AE:70:8D:31:08:7D:2D:AF:53:02:3A',
    });
  });

  it('has the supported extensions', function() {
    return readJsonAsset('extensions.json').then((extensions) => {
      expect(videoMedia.extensions).to.eql(extensions);
    });
  });

  it('has the ssrcs', function() {
    return readJsonAsset('ssrcs.json').then((ssrcs) => {
      expect(videoMedia.ssrcs).to.eql(ssrcs);
    });
  });

  it('has the candidates', function() {
    return readJsonAsset('candidates.json').then((candidates) => {
      expect(videoMedia.candidates).to.eql(candidates);
    });
  });
});
