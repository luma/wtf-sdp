const collatableTypes = ['rtpmap', 'fmtp', 'rtcp-fb'];


/**
 * Merges a single attribute into an existing dictionary. This is basically
 * just copying enumerable properties from attr to payload (like Object.assign)
 * except that rather than overwriting existing keys it will allow multiple values
 * to be under a single key (it's a multimap).
 *
 *  ```
 *    const payload = { foo: 'bar' };
 *    collateAttr(payload, {
 *      id: 'foos',
 *      fo: 'baz'
 *    });
 *    payload === {
 *      id: 'foos',
 *      foo: ['bar', 'baz'],
 *    }
 * ```
 *
 * @private
 * @param  {Object} payload The current payload
 * @param  {Object} attr    The new attribute to merge into payload
 * @return {Object}         The uploaded payload
 *
 */
export const collateAttr = (payload, attr) => {
  for (const key in attr) {
    if (attr.hasOwnProperty(key)) {
      const value = attr[key];

      if (!payload.hasOwnProperty(key)) {
        payload[key] = value;
      } else if (!Array.isArray(payload[key])) {
        payload[key] = [payload[key], value];
      } else {
        payload[key].push(value);
      }
    }
  }
};

/**
 * Takes a list of supported formats (payload ids) and a list of attributes and
 * produces an object that maps formats to their collated rtp, fmtp, and rtcp-fb
 * attributes.
 *
 * This is usually used in the context of a specific SDP media line. In this
 * context the formats will be the supported formats from the media line itself
 * and attrs will be all attribute lines that belong to that media.
 *
 * @private
 * @param  {Array} rawFormats Array of supported formats (payload ids)
 * @param  {Array} attrs      Array of
 * @return {Map}              A map of format to payload properties.
 */
export const collatePayloads = (rawFormats, attrs) => {
  const formats = new Set(rawFormats);
  const payloads = new Map();

  for (const attr of attrs) {
    if (attr.value && attr.value.format && formats.has(attr.value.format)) {
      const { format, ...rest } = attr.value;

      if (!payloads.has(format)) {
        payloads.set(format, { id: format });
      }

      if (collatableTypes.includes(attr.type)) {
        collateAttr(payloads.get(format), rest);
      }
    }
  }

  return payloads;
};
