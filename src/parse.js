import Tracer from 'pegjs-backtrace';
import parser from './grammar.js';

export class ParserError extends Error {
  /**
   * An object that wraps up all parser errors. We do our best to ensure
   * that all passing errors always have a useful stacktrace.
   *
   * @constructor
   * @param {String} message    A human readable error message
   * @param {Object} stack      Optional. If it's available, this will be the
   * stack trace for this error. If this param is not provided we will do our best
   * to capture it using other means.
   */
  constructor(message, stack) {
    super(message);

    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      // Creates the this.stack getter
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Parses a raw SDP string into a JSON object.
 *
 * @function parse
 * @param  {String} rawSdp The raw SDP to parse
 * @return {Promise}       A promise that will resolve with a JSON representation
 * of the SDP. It will reject with an instance of ParseError.
 */
export default (rawSdp) => {
  if (!rawSdp) {
    const err = new ParserError('There was no SDP to parse');
    return Promise.reject(err);
  }

  const tracer = new Tracer(rawSdp, {
    showFullPath: true,
  });
  let sdp;

  try {
    sdp = parser.parse(rawSdp, { tracer: tracer });
  } catch (e) {
    const err = new ParserError(e.toString(), tracer.getBacktraceString());
    return Promise.reject(err);
  }

  return Promise.resolve(sdp);
};
