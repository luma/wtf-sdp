import memoize from 'lodash.memoize';
// import { memoize } from 'decko';
import Attributes from './attributes.js';
import { collatePayloads } from './payloads.js';
import filterUndefinedValues from './util/filter_undefined_values.js';

export default class Media {
  constructor(raw) {
    const self = this;
    const memoizePayloads = memoize(() => collatePayloads(self.formats, self.attrs));
    const memoizeExtensions = memoize(() => {
      return self.attrs.get('extmap').reduce((exts, ext) => {
        exts[ext.value] = ext.extension;
        return exts;
      }, {});
    });
    const memoizeSSRCs = memoize(() => {
      return self.attrs.get('ssrc').reduce((ssrcs, { id, attribute } = {}) => {
        if (!ssrcs[id]) {
          ssrcs[id] = [];
        }

        ssrcs[id].push(attribute);
        return ssrcs;
      }, {});
    });

    Object.defineProperties(this, {
      raw: { value: raw },
      attrs: { value: new Attributes(raw.attrs) },
      extensions: { get: memoizeExtensions },
      payloads: { get: memoizePayloads },
      ssrcs: { get: memoizeSSRCs },
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

  // @memoize
  // get payloads() {
  //   return collatePayloads(this.raw.formats, this.raw.attrs);
  // }

  // @memoize
  // get extensions() {
  //   return this.attrs.get('extmap').reduce((exts, ext) => {
  //     exts[ext.value] = ext.extension;
  //   }, {});
  // }

  // @memoize
  // get ssrcs() {
  //   return self.attrs.get('ssrc').reduce((ssrcs, { id, attribute } = {}) => {
  //     if (!ssrcs[id]) {
  //       ssrcs[id] = [];
  //     }
  //
  //     ssrcs[id].push(attribute);
  //     return ssrcs;
  //   }, {});
  // }

  get ssrcGroups() {
    // @TODO map the ssrc ids to specific objects in `this.ssrcs()``?
    return this.attrs.get('ssrc-group');
  }

  get candidates() {
    return this.attrs.get('candidate');
  }

  toJson() {
    const payloads = {};
    for (const [id, payload] of this.payloads) {
      payloads[id] = payload;
    }

    return filterUndefinedValues({
      id: this.id,
      type: this.type,
      port: this.port,
      protocol: this.protocol,
      connections: this.connections,
      ice: this.ice,
      direction: this.direction,
      fingerprint: this.fingerprint,
      extensions: this.extensions,
      ssrcs: this.ssrcs,
      ssrcGroups: this.ssrcGroups,
      candidates: this.candidates,
      payloads: payloads,
      attrs: this.attrs,
    });
  }
}
