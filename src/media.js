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
