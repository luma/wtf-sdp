import Tracer from 'pegjs-backtrace';
import parser from './grammar.js';

class ParserError {
  constructor(message, backtrace) {
    this.message = message;
    this.backtrace = backtrace;
  }
}

export default (rawSdp) => {
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
