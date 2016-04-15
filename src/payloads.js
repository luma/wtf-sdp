import omit from 'lodash.omit';
import assignIn from 'lodash.assignin';

const collateFmtp = (payload, attr) => {
  if (!payload.params) {
    payload.params = attr.params;
  } else {
    payload.params = payload.params.concat(attr.params);
  }
};

const collateRtcpFeedback = (payload, attr) => {
  if (!payload.feedback) {
    payload.feedback = [attr.feedback];
  } else {
    payload.feedback.push(attr.feedback);
  }
};

export const collatePayloads = (rawFormats, attrs) => {
  const formats = new Set(rawFormats);
  const payloads = {};

  for (const attr of attrs) {
    const id = attr.format;

    if (id && formats.has(id)) {
      if (!payloads.hasOwnProperty(id)) {
        payloads[id] = { id };
      }
      const payload = payloads[id];

      switch (attr.type) {
      case 'rtpmap':
        assignIn(payloads[id], omit(attr, ['type', 'format']));
        break;

      case 'fmtp':
        collateFmtp(payload, attr);
        break;

      case 'rtcp-fb':
        collateRtcpFeedback(payload, attr);
        break;

      default:
        // NOOP
      }
    }
  }

  return payloads;
};
