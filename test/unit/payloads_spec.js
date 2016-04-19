/* eslint max-nested-callbacks: [0] */
import { collatePayloads, collateAttr } from '../../src/payloads.js';
import { readJsonAsset } from '../helpers/file_helpers.js';

describe('Payloads', function() {
  const rtcpFbs = [
    {
      feedback: {
        type: 'ccm',
        params: ['fir'],
      },
    }, {
      feedback: {
        type: 'nack',
      },
    }, {
      feedback: {
        type: 'nack',
        params: ['pli'],
      },
    },
  ];

  describe('collateAttr', function() {
    let payload;

    beforeEach(function() {
      payload = {};
      collateAttr(payload, rtcpFbs[0]);
    });

    it('adds new keys when they are not already in the payload', function() {
      // None of the keys in rtcpFbs exist in payload, so payload will basically
      // just be a clone of rtcpFbs.
      expect(payload).to.eql(rtcpFbs[0]);
    });

    it('converts existing non-array values to arrays', function() {
      expect(payload.feedback).to.eql(rtcpFbs[0].feedback);
      collateAttr(payload, rtcpFbs[1]);
      expect(payload.feedback).to.eql([
        rtcpFbs[0].feedback,
        rtcpFbs[1].feedback,
      ]);
    });

    it('pushes new values into existing array values', function() {
      collateAttr(payload, rtcpFbs[1]);
      collateAttr(payload, rtcpFbs[2]);

      expect(payload.feedback).to.eql([
        rtcpFbs[0].feedback,
        rtcpFbs[1].feedback,
        rtcpFbs[2].feedback,
      ]);
    });
  });

  describe('collatePayloads', function() {
    let payloads, attrs, formats;

    beforeEach(function() {
      return readJsonAsset('test_sdp.json').then((sdpJson) => {
        attrs = sdpJson.media[1].attrs;
        formats = sdpJson.media[1].formats;
        payloads = collatePayloads(formats, attrs);
      });
    });

    function verifyRtpmap(id, encodingName, clockRate, encodingParams) {
      const payload = payloads.get(id);
      expect(payload).to.have.property('id', id);
      expect(payload).to.have.property('encodingName', encodingName);
      expect(payload).to.have.property('clockRate', clockRate);

      if (encodingParams) {
        expect(payload).to.have.property('encodingParams', encodingParams);
      } else {
        expect(payload.encodingParams).to.be.undefined;
      }
    }

    it('merges the rtpmap details into the payload', function() {
      verifyRtpmap('96', 'rtx', 90000);
      verifyRtpmap('97', 'rtx', 90000);
      verifyRtpmap('98', 'rtx', 90000);
      verifyRtpmap('100', 'VP8', 90000);
      verifyRtpmap('101', 'VP9', 90000);
      verifyRtpmap('116', 'red', 90000);
      verifyRtpmap('117', 'ulpfec', 90000);
    });

    function verifyFmtp(id, params) {
      const payload = payloads.get(id);
      expect(payload.params).to.eql(params);
    }

    it('merges the fmtp details into the payload', function() {
      verifyFmtp('96', ['apt=100']);
      verifyFmtp('97', ['apt=101']);
      verifyFmtp('98', ['apt=116']);
      verifyFmtp('100');
      verifyFmtp('101');
      verifyFmtp('116');
      verifyFmtp('117');
    });

    function verifyRtcpFb(id, feedback) {
      const payload = payloads.get(id);
      expect(payload.feedback).to.eql(feedback);
    }

    it('merges the rtcp-fb details into the payload', function() {
      verifyRtcpFb('96');
      verifyRtcpFb('97');
      verifyRtcpFb('98');
      verifyRtcpFb('100', [
        { type: 'ccm', params: ['fir'] },
        { type: 'nack' },
        { type: 'nack', params: ['pli'] },
        { type: 'goog-remb' },
        { type: 'transport-cc' },
      ]);
      verifyRtcpFb('101', [
        { type: 'ccm', params: ['fir'] },
        { type: 'nack' },
        { type: 'nack', params: ['pli'] },
        { type: 'goog-remb' },
        { type: 'transport-cc' },
      ]);
      verifyRtcpFb('116');
      verifyRtcpFb('117');
    });
  });
});
