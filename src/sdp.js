import memoize from 'lodash.memoize';
import Attributes from './attributes.js';
import Media from './media.js';
import parse from './parse.js';
import filterUndefinedValues from './util/filter_undefined_values.js';

export default class Sdp {
  static parse(rawSdp) {
    return parse(rawSdp).then((sdp) => new Sdp(sdp));
  }

  constructor(raw) {
    Object.defineProperties(this, {
      raw: { value: raw },
      attrs: { value: new Attributes(raw.attrs) },
      media: { value: raw.media.map((m) => new Media(m)) },
    });
  }

  get version() {
    return this.raw.version;
  }

  get origin() {
    return this.raw.origin;
  }

  get sessionName() {
    return this.raw.sessionName;
  }

  get times() {
    return this.raw.times;
  }

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

  get connection() {
    return this.raw.connection;
  }

  get groups() {
    return this.attrs.get('group');
  }

  get ice() {
    return {
      pwd: this.attrs.first('ice-pwd'),
      ufrag: this.attrs.first('ice-ufrag'),
      lite: this.attrs.has('ice-lite'),
      mismatch: this.attrs.has('ice-mismatch'),
      options: this.attrs.first('ice-options'),
    };
  }

  get attrs() {
    return memoize(() => new Attributes(this.raw.attrs));
  }

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
