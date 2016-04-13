import omit from 'lodash.omit';
import assignIn from 'lodash.assignin';
import memoize from 'lodash.memoize';
import Attributes from './attributes.js';


const collatePayloads = (rawFormats, attrs) => {
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
        if (!payload.params) {
          payload.params = attr.params;
        } else {
          payload.params = payload.params.concat(attr.params);
        }
        break;

      case 'rtcp-fb':
        if (!payload.feedback) {
          payload.feedback = [attr.feedback];
        } else {
          payload.feedback.push(attr.feedback);
        }
        break;

      default:
        // NOOP
      }
    }
  }

  return payloads;
};

export default class Media {
  constructor(raw) {
    const memoizePayloads = memoize(() => collatePayloads(raw.formats, raw.attrs));

    Object.defineProperties(this, {
      raw: { value: raw },
      attrs: { value: new Attributes(raw.attrs) },
      payloads: { get: memoizePayloads },
    });
  }

  get id() {
    return this.attrs.first('mid');
  }

  get type() {
    return this.raw.type;
  }

  get port() {
    return this.raw.port;
  }

  get protocol() {
    return this.raw.protocol;
  }

  get connection() {
    return this.raw.connection;
  }

  get ice() {
    return {
      pwd: this.attrs.first('ice-pwd'),
      ufrag: this.attrs.first('ice-ufrag'),
      options: this.attrs.first('ice-options'),
    };
  }

  get direction() {
    return this.attrs.first('direction');
  }

  get fingerprint() {
    return this.attrs.first('fingerprint');
  }

  get extensions() {
    return this.attrs.get('extmap');
  }

  get ssrcs() {
    return this.attrs.get('ssrcs');
  }

  get candidates() {
    return this.attrs.get('candidates');
  }
}
