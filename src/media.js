import memoize from 'lodash.memoize';
import Attributes from './attributes.js';
import { collatePayloads } from './payloads.js';


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

  get connections() {
    return this.raw.connections;
  }

  get ice() {
    const ice = {
      pwd: this.attrs.first('ice-pwd'),
      ufrag: this.attrs.first('ice-ufrag'),
      options: this.attrs.first('ice-options'),
    };

    for (const key in ice) {
      if (ice.hasOwnProperty(key) && ice[key] === void 0) {
        delete ice[key];
      }
    }

    return ice;
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
    return this.attrs.get('ssrc');
  }

  get candidates() {
    return this.attrs.get('candidate');
  }

  // @TODO something with SSRC groupings?
}
