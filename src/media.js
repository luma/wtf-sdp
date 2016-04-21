import memoize from 'lodash.memoize';
// import { memoize } from 'decko';
import Attributes from './attributes.js';
import { collatePayloads } from './payloads.js';
import collateSSRCs from './ssrcs.js';
import filterUndefinedValues from './util/filter_undefined_values.js';
import mapToObject from './util/map_to_object.js';

export default class Media {
  /**
   * Represents a SDP media section
   *
   * @constructor
   * @param  {Object} raw A raw JSON representation of the media section
   */
  constructor(raw) {
    const self = this;
    // @TODO this stuff could all go away if I could get the memoize decorator
    // working with Babel 6
    const memoizePayloads = memoize(() => collatePayloads(self.formats, self.attrs));
    const memoizeSSRCs = memoize(() => collateSSRCs(self.attrs.get('ssrc')));
    const memoizeExtensions = memoize(() => {
      return self.attrs.get('extmap').reduce((exts, ext) => {
        exts.set(ext.value, ext.extension);
        return exts;
      }, new Map());
    });

    Object.defineProperties(this, {
      /**
       * Get the raw JSON version of this media section. This will be the original
       * version from the parser. If you want a more friendly version you should use
       * `media.toJson()` instead.`
       *
       * @property {Object} raw - returns the raw JSON version of this media section
       * @memberof Media#
       */
      raw: { value: raw },

      /**
       * Returns a collection of all attributes for this media section. Many types
       * of attributes have custom getters (e.g. candidates, ssrcs, payloads, etc)
       * so you would only use this property when you are doing something less common.
       *
       * @property {Attributes} attrs - returns a collection of all attributes
       * @memberof Media#
       */
      attrs: { value: new Attributes(raw.attrs) },

      /**
       * Returns all extensions (extmap) as map of value => extension.
       *
       *  ```
       *    const extensions = media.extensions.get('1')
       *    // extensions == 'urn:ietf:params:rtp-hdrext:ssrc-audio-level'
       * ```
       *
       * @property {Map} extensions - returns a map of value => extension
       * @memberof Media#
       */
      extensions: { get: memoizeExtensions },

      /**
       * Returns all payloads as map of id => paylaod.
       *
       *  ```
       *    const opus = media.payloads.get('111');
       *    opus.encodingName === 'opus';
       *    opus.feedback === [{ type: 'transport-cc' }];
       *    opus.params === ['minptime=10']
       * ```
       *
       * @property {Map} payloads - returns a map of id => payload
       * @memberof Media#
       */
      payloads: { get: memoizePayloads },

      /**
       * Returns all ssrcs as map of id => ssrc.
       *
       *  ```
       *    const ssrc = media.ssrcs.get('3339118420');
       *    ssrc.cname === 'qNn0vt04pMSU';
       *    ssrc.msid === 'y2Pkbz4KgqrQz9Rx1WM91xAOsAOYAYZNcucu 85c70629-98cd...';
       *    ssrc.label === '85c70629-98cd-4ce4-8508-b9374c7baa6d';
       * ```
       *
       * @property {Map} payloads - returns a map of id => payload
       * @memberof Media#
       */
      ssrcs: { get: memoizeSSRCs },
    });
  }

  /**
   * Get the mid
   * @property {String} The mid
   */
  get id() {
    return this.attrs.first('mid');
  }

  /**
   * Get the media type.
   * @property {String} The media type. Usually video, audio, or data.
   */
  get type() {
    return this.raw.type;
  }

  /**
   * Get the media port.
   * @property {Number} The port.
   */
  get port() {
    return this.raw.port;
  }

  /**
   * Get the media protocol
   * @property {String} The media protocol, i.e. 'RTP/SAVPF'
   */
  get protocol() {
    return this.raw.protocol;
  }

  /**
   * Return the ids of the supported payloads. Use `media.payloads.get(payloadid)`
   * to retrieve payload info.
   *
   * @property {Array} Array of payload ids (strings)
   */
  get formats() {
    return this.raw.formats;
  }

  /**
   * Get the details of all connections for this media
   *
   *  ```
   *    const conn = media.connections[0];
   *    conn.netType === 'IN';
   *    conn.addressType === 'IP4';
   *    conn.address === '0.0.0.0'
   * ```
   *
   * @property {Array} Array of connection data
   */
  get connections() {
    return this.raw.connections;
  }

  /**
   * Return all ICE relates properties for this media.
   *
   * @property {Object} An object that will contain properties for pwd, ufrag, options. Properties
   * will only exist if the media defines them so ice may just return an empty object.
   */
  get ice() {
    return filterUndefinedValues({
      pwd: this.attrs.first('ice-pwd'),
      ufrag: this.attrs.first('ice-ufrag'),
      options: this.attrs.first('ice-options'),
    });
  }

  /**
   * Indicates the 'direction' of the media. The direction can be 'sendonly', 'recvonly',
   * 'sendrecv', or 'inactive'. 'inactive' is also a direction :-/
   *
   * @property {String} A string representing the direction
   */
  get direction() {
    return this.attrs.first('direction');
  }

  /**
   * Returns details about the fingerprint. This includes the actual fingering string as well as
   * the hash function that was used to generate it.
   *
   * @property {Object} An object containing  `hashFunction` and `fingerprint` properties.
   */
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

  /**
   * Get all ssrc groups for this media.
   * @property {Array} Array of ssrc groups.
   */
  get ssrcGroups() {
    // @TODO map the ssrc ids to specific objects in `this.ssrcs()``?
    return this.attrs.get('ssrc-group');
  }

  /**
   * Get all candidates for this media.
   *
   *  ```
   *    const cand = media.candidates[0];
   *    cand.foundation === '2';
   *    cand.componentId === 1;
   *    cand.transport === 'UDP'
   *    cand.address === '192.0.2.3'
   *    cand.type === 'srflx'
   *    cand.relAddr === '10.0.1.1'
   *    cand.relPort === 8998
   * ```
   *
   * @return {Array} Array of candidate objects
   */
  get candidates() {
    return this.attrs.get('candidate');
  }

  /**
   * Returns a simple JSON representation of the media.
   *
   * @return {String} A JSON version of this object
   */
  toJson() {
    return filterUndefinedValues({
      id: this.id,
      type: this.type,
      port: this.port,
      protocol: this.protocol,
      connections: this.connections,
      ice: this.ice,
      direction: this.direction,
      fingerprint: this.fingerprint,
      extensions: mapToObject(this.extensions),
      ssrcs: mapToObject(this.ssrcs),
      ssrcGroups: this.ssrcGroups,
      candidates: this.candidates,
      payloads: mapToObject(this.payloads),
      attrs: this.attrs,
    });
  }
}
