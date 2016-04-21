# WTF SDP

[![Build Status](https://travis-ci.org/luma/wtf-sdp.svg?branch=master)](https://travis-ci.org/luma/wtf-sdp)
[![Code Climate](https://codeclimate.com/github/luma/wtf-sdp/badges/gpa.svg)](https://codeclimate.com/github/luma/wtf-sdp)
[![Test Coverage](https://codeclimate.com/github/luma/wtf-sdp/badges/coverage.svg)](https://codeclimate.com/github/luma/wtf-sdp/coverage)


### Motivation

SDP is painful to work with. Really painful, but there are three things that can make it a pleasant experience

1. A decent, standards compliant parser
2. An API that allows you to work quicker and at a higher level of abstraction. This should include the ability to search, filter, and serialise the parsed SDP
3. Some way to understand what those obscure, undocumented, or proprietary lines actually mean. Some way to say WTF SDP?

This module intends to provide all three.


### Current status

#### Parser

It has excellent support for the core RFCs and pretty decent support for various extensions. For example  Source-Specific Media Attributes, RTP Header Extensions, and extended RTP Profiles .

Unit tests are in place and coverage is good. We could use more tests covering specific scenarios such as multple streams (Unified Plan and Plan B) and Simulcast.

Currently the parser will only parse a complete, fully-formed SDP. It would be nice if the parser could also parse smaller chunks. E.g. just parse text that represents a Media section.


#### API

It provides easy access to the common fields (candidates, crypto, direction, ice, etc). Information about each payload is also aggregated together. Extensions, candidates, ssrcs are easily accessible.

See the usage section for examples.


### Explain SDP

I haven't begun work on this yet.

### Installation


```shell
git clone https://github.com/luma/wtfsdp.git
cd wtfsdp
npm link
```


### Usage

#### Using the high-level API

``` javascript
import { Sdp } from '../src';
const rawSdp = '...';

Sdp.parse(rawSdp).then((sdp) => {
  console.log('Origin:')
  console.log('\tnetType', sdp.origin.netType);             // e.g. 'IN'
  console.log('\taddressType', sdp.origin.addressType);     // e.g. 'IP4'
  console.log('\taddress', sdp.origin.address);             // e.g. '127.0.0.1'

  // Log out the session-level ICE info: ice-pwd, ice-ufrag, ice-lite, ice-mismatch, ice-options
  console.log('ICE:', sdp.ice);

  const bundle sdp.groups.find((group) => group.semantics === 'BUNDLE');
  if (bundle) {
    console.log('Bundled media:', bundle.ids.join(', '));
  } else {
    console.log('Media is not bundled');
  }

  for (const media of sdp.media) {
    console.log(media.type, 'media. Id:', media.id);
    console.log('Port:', media.port, '. Protocol:', media.protocol);

    // Log out the media-level ICE info: ice-pwd, ice-ufrag, ice-options
    // These override any options also defined at the session level.
    console.log('ICE:', sdp.ice);

    for (const [id, payload] of sdp.payloads) {
      console.log('Payload', payload.encodingName);       // e.g. 'opus'
      console.log('Feedback', payload.feedback);          // e.g. [{type: 'transport-cc' }]
      console.log('Params', payload.params);              // e.g. ['minptime=10']
    }
  }
}).catch((err) => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
});
```

#### Using the low-level API



``` javascript
import { parse } from '../src';
const rawSdp = '...';

parse(rawSdp).then((sdp) => {
  // sdp is just a JSON representation of the parsed SDP.
  console.log(JSON.stringify(sdp));
}).catch((err) => {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
});
```

### Examples

See the [example dir](../master/example).

You can run the two examples with `npm run example` and `npm run example2`.

### Common Tasks

* **npm test**: run the tests
* **npm run build**: build the release library into the `lib/` dir
* **npm run doc**: generate the docs. They will be placed in the `docs/` folder
* **npm run todo**: Creates a TODO.md file that lists all the TODOs/FIXMEs/etc in the project

### Contributing

See [CONTRIBUTING.md](../master/CONTRIBUTING.md)

### TODO

* Docs
* Test are missing a lot of edge cases, they need to be improved
* Human readable lookups of the [RTP Compact Header Extensions](https://www.iana.org/assignments/rtp-parameters/rtp-parameters.xml). [RFC5285](http://tools.ietf.org/html/rfc5285)
* Human readable lookups of the [FMT Values for PSFB Payload Types](https://www.iana.org/assignments/rtp-parameters/rtp-parameters.xml). [RFC4585](http://www.iana.org/go/rfc4585)
* Human readable lookups of the [RTP Profile Names](https://www.iana.org/assignments/rtp-parameters/rtp-parameters.xml).
* Human readable lookups of the [RTP Payload Format media types](https://www.iana.org/assignments/rtp-parameters/rtp-parameters.xml)
* the Explain SDP API
* Serialiser
