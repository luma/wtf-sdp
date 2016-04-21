

// @TODO unit tests
export default (rawSSRCs) => {
  return rawSSRCs.reduce((ssrcs, { id, attribute } = {}) => {
    if (!ssrcs.has(id)) {
      ssrcs.set(id, {});
    }

    const ssrc = ssrcs.get(id);

    if (ssrc.hasOwnProperty(attribute.type)) {
      // Is this legal?
      throw new Error('SSRC has multiple values for the same name');
    }

    // Sometimes value will be empty, which is legit. Those will end up being
    // keys with values that are undefined. Is that ok or should we figure
    // out a better representation?
    ssrc[attribute.type] = attribute.value;
    return ssrcs;
  }, new Map());
};
