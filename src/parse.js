import Tracer from 'pegjs-backtrace';
import parser from './grammar.js';

export class ParserError extends Error {
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
