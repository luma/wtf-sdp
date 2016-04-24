import Attributes from './attributes.js';
import Media from './media.js';
import parse from './parse.js';
import filterUndefinedValues from './util/filter_undefined_values.js';

export default class Sdp {
  /**
   * Parses a SDP string into a Sdp object.
   * @param  {String} rawSdp  Raw SDP as a String
   * @return {Promise}        A promise that will resolve with the new Sdp object. If parsing
   * fails it will reject with a ParserError
   */
  static parse(rawSdp) {
    return parse(rawSdp).then((sdp) => new Sdp(sdp));
  }

  /**
   * Wraps up a raw JSON representation of SDP and provides a higher-level API
   * to access it.
   *
   * @constructor
   * @param  {Object} raw A raw JSON representation of the parsed SDP
   */
  constructor(raw) {
    Object.defineProperties(this, {

      /**
       * Get the raw JSON version of this Sdp. This will be the original version from
       * the parser. If you want a more friendly version you should use `sdp.toJson()` instead.`
       *
       * @property {Object} raw - returns the raw JSON version of this Sdp
       * @memberof Sdp#
       */
      raw: { value: raw },

      /**
       * Returns a collection of all attributes for this sdp. Many types
       * of attributes have custom getters (e.g. groups, ice, etc) so you would
       * only use this property when you are doing something less common.
       *
       * @property {Attributes} attrs - returns a collection of all attributes
       * @memberof Sdp#
       */
      attrs: { value: new Attributes(raw.attrs) },

      /**
       * Get all Media sections for this SDP
       * @property {Array}    An array of Media objects representing all media sections
       * @memberof Sdp#
       */
      media: { value: raw.media.map((m) => new Media(m)) },
    });
  }

  /**
   * Get the sdp version
   * @property {Number} The version of SDP in use
   */
  get version() {
    return this.raw.version;
  }

  /**
   * Get the sdp origin
   * @property {Object} The SDP origin
   */
  get origin() {
    return this.raw.origin;
  }

  /**
   * Get the sdp session name
   * @property {String} The SDP session name
   */
  get sessionName() {
    return this.raw.sessionName;
  }

  /**
   * Gets the array of times when the session is active
   * @property {Array} Array of time objects
   */
  get times() {
    return this.raw.times;
  }

  /**
   * Returns the session info, which is a string that describes the topic of the session.
   * @property {String} A string that describes the session
   */
  get info() {
    return this.raw.info;
  }

  get uri() {
    return this.raw.uri;
  }

  get emails() {
    return this.raw.emails;
  }

  get phones() {
    return this.raw.phones;
  }

  /**
   * Get the details of the session connection
   *
   *  ```
   *    const conn = sdp.connection;
   *    conn.netType === 'IN';
   *    conn.addressType === 'IP4';
   *    conn.address === '0.0.0.0'
   * ```
   *
   * @property {Object} An object of connection data
   */
  get connection() {
    return this.raw.connection;
  }

  /**
   * Gets the grouping policies for media.
   *
   * @property {Array} An array of objects, each object will define the group semantics and
   * the media ids that it applies to.
   */
  get groups() {
    return this.attrs.get('group');
  }

  /**
   * Return all ICE relates properties
   *
   * @property {Object} An object that will contain properties for pwd, ufrag, options, lite,
   * and mismatch. Properties will only exist if the media defines them so ice may just
   * return an empty object.
   */
  get ice() {
    return filterUndefinedValues({
      pwd: this.attrs.first('ice-pwd'),
      ufrag: this.attrs.first('ice-ufrag'),
      lite: this.attrs.has('ice-lite'),
      mismatch: this.attrs.has('ice-mismatch'),
      options: this.attrs.first('ice-options'),
    });
  }

  /**
   * Returns a simple JSON representation of the sdp.
   *
   * @return {String} A JSON version of this object
   */
  toJson() {
    return filterUndefinedValues({
      version: this.version,
      origin: this.origin,
      sessionName: this.sessionName,
      times: this.times,
      info: this.info,
      uri: this.uri,
      emails: this.emails,
      phones: this.phones,
      groups: this.groups,
      connection: this.connection,
      ice: this.ice,
      attrs: this.attrs.toJson(),
      media: this.media.map((m) => m.toJson()),
    });
  }
}
