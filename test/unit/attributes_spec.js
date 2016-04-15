/* eslint max-nested-callbacks: [0] */
import Attributes from '../../src/attributes.js';
import { readAsset } from '../helpers/file_helpers.js';

describe('Attributes', function() {
  let attrs, rawAttrs;

  beforeEach(function() {
    return readAsset('test_attributes_sdp.json').then((_rawAttrs) => {
      rawAttrs = JSON.parse(_rawAttrs);
      attrs = new Attributes(rawAttrs);
    });
  });

  it('returns the raw attribute lines when calling #all', function() {
    expect(attrs.all).to.eql(rawAttrs);
  });

  it('returns the number of attributes', function() {
    expect(attrs.length).to.equal(rawAttrs.length);
  });

  describe('find', function() {
    it('searches for the first attribute that satisfies a testing function', function() {
      const actual = attrs.find((attr) => {
        return attr.value.extension === 'urn:ietf:params:rtp-hdrext:ssrc-audio-level';
      });

      expect(actual).to.be.defined;
      expect(actual).to.eql(rawAttrs[6].value);
    });

    it('returns undefined if it cannot find a single matching attribute', function() {
      const result = attrs.find((attr) => attr.type === 'lol');
      expect(result).to.be.undefined;
    });

    it('will throw an exception if no testing function is provided', function() {
      expect(() => {
        attrs.find();
      }).to.throw(TypeError, 'predicate must be a function');
    });

    it('will throw an exception if the testing function is not a valid function', function() {
      expect(() => {
        attrs.find('I am a function!');
      }).to.throw(TypeError, 'predicate must be a function');
    });
  });

  describe('filter', function() {
    it('searches for all attributes that satisfy a testing function', function() {
      const result = attrs.filter((attr) => attr.type.indexOf('ice-') === 0);
      expect(result).to.eql([
        { type: 'ice-ufrag', value: '4dS4NkAMrAgKccxA' },
        { type: 'ice-pwd', value: 'VC9qlvEt54AXvF91TEYIdNe+' },
      ]);
    });

    it('will throw an exception if no testing function is provided', function() {
      expect(() => {
        attrs.filter();
      }).to.throw(TypeError, 'predicate must be a function');
    });

    it('will throw an exception if the testing function is not a valid function', function() {
      expect(() => {
        attrs.filter('I am a function!');
      }).to.throw(TypeError, 'predicate must be a function');
    });
  });

  describe('first', function() {
    it('returns the first attribute with a specific type', function() {
      expect(attrs.first('rtpmap')).to.eql(rawAttrs[10].value);
    });

    it('caches responses so it only needs to search the attributes once', function() {
      const expected = rawAttrs[10].value;
      expect(attrs.first('rtpmap')).to.eql(expected);
      // Remove the match from the underlying array...
      rawAttrs.splice(10, 1);
      // ...but it should still return the original value as the search has been cached.
      expect(attrs.first('rtpmap')).to.eql(expected);
    });
  });

  describe('has', function() {
    it('returns true when there is at least one attribute with a specific type', function() {
      expect(attrs.has('fingerprint')).to.be.true;
    });

    it('returns false when there are no attributes with a specific type', function() {
      expect(attrs.has('trolololo')).to.be.false;
    });
  });

  describe('get', function() {
    it('returns all attribute with a specific type', function() {
      const extmaps = attrs.get('extmap');
      expect(extmaps).to.eql([
        {
          value: '1',
          extension: 'urn:ietf:params:rtp-hdrext:ssrc-audio-level',
        }, {
          value: '3',
          extension: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
        },
      ]);
    });

    it('caches responses so it only needs to search the attributes once', function() {
      const extmaps = attrs.get('extmap');
      // Remove the match from the underlying array...
      rawAttrs.splice(6, 2);
      // ...but it should still return the original value as the search has been cached.
      expect(attrs.get('extmap')).to.eql(extmaps);
    });
  });

  it('can iterator over the attribute lines', function() {
    let i = 0;
    for (const line of attrs) {
      expect(line).to.eql(rawAttrs[i]);
      i += 1;
    }
  });
});
