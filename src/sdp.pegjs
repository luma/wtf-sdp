/*
 * Session Description Protocol (SDP) grammar
 * ==========================================
 *
 * See https://tools.ietf.org/html/rfc4566
 */
{
  function extractFirst(array) {
    if (array.length === 0) {
      return [];
    }

    return array.map((element) => element[1]);
  }

  function typeWithParams(type, params) {
    const obj = { type };

    if (Array.isArray(params)) {
      if (params.length) {
        obj.params = params;
      }
    } else if (params) {
      obj.params = [params];
    }

    return obj;
  }
}

SessionDescription = a:ProtoVersion b:OriginField c:SessionNameField d:InformationField?
                     e:UriField? f:EmailFields? g:PhoneFields? h:ConnectionField?
                     i:BandwidthFields j:TimeFields k:KeyField? l:SessionAttributeFields
                     m:MediaDescriptions {

  var sdp = {
    version: a,
    origin: b,
    sessionName: c,
    times: j.times,
    attrs: l,
    media: m
  };

  if (j.zoneAdjustments) {
    sdp.zoneAdjustments = j.zoneAdjustments;
  }

  if (d) { sdp.info = d; }
  if (e) { sdp.uri = e; }
  if (f) { sdp.emails = f; }
  if (g) { sdp.phones = g; }
  if (h) { sdp.connection = h; }
  if (i) { sdp.bandwidths = i; }
  if (k) { sdp.key = k; }

  return sdp;
}

// this memo describes version 0
ProtoVersion = "v=" version:DIGIT+ EOL {
  return parseInt(version.join(''), 10);
}

OriginField = "o=" a:username SP b:SessId SP c:SessVersion SP d:nettype SP e:addrtype SP f:UnicastAddress EOL {
  return {
    username: a,
    session: {
      id: b,
      version: c,
    },
    netType: d,
    addressType: e,
    address: f,
  };
}

SessionNameField = "s=" sessionName:text EOL {
  return sessionName;
}

InformationField = "i=" value:text EOL {
  return value;
}


UriField = "u=" uri:$uri EOL {
  return uri;
}

EmailFields = emails:("e=" $EmailAddress EOL)*  {
  if (emails.length === 0) {
    return void 0;
  }

  return extractFirst(emails);
}

PhoneFields = phoneNumbers:("p=" $PhoneNumber EOL)* {
  if (phoneNumbers.length === 0) {
    return void 0;
  }

  return extractFirst(phoneNumbers);
}

// a connection field must be present in every media description
// or at the session-level
ConnectionField = "c=" a:nettype SP b:addrtype SP c:$ConnectionAddress EOL {
  return {
    netType: a,
    addressType: b,
    address: c
  };
}

BandwidthFields = bandwidths:BandwidthField* {
  if (bandwidths.length === 0) {
    return void 0;
  }

  return bandwidths;
}

BandwidthField = "b=" type:bwtype ":" value:bandwidth EOL {
  return {
    type: type,
    value: value,
  };
}

TimeFields = times:TimeField+ z:(ZoneAdjustments EOL)? {
  var timeFields =  {
    times: times,
  };

  if (z) {
    timeFields.zoneAdjustments = z[0];
  }

  return timeFields;
}

TimeField = "t=" a:StartTime SP b:StopTime r:(EOL RepeatFields)* EOL {
  var line = {
    start: a,
    stop: b,
  };

  if (r && r.length) {
    line.repeats = extractFirst(r)
  }

  return line;
}

// r=<repeat interval> <active duration> <offsets from start-time>
// https://tools.ietf.org/html/rfc4566#section-5.10
RepeatFields =  "r=" interval:RepeatInterval SP activeDuration:TypedTime offsets:(SP TypedTime)+ {
  return {
    interval: interval,
    activeDuration: activeDuration,
    offsets: extractFirst(offsets),
  }
}


// z=<adjustment time> <offset> <adjustment time> <offset> ....
// https://tools.ietf.org/html/rfc4566#section-5.11
ZoneAdjustments = "z=" time:time SP offset:$("-"? TypedTime) rest:(SP time SP $("-"? TypedTime))* {
  return [
    { time: time, offset: offset}
  ].concat(rest.map(function(adjustment) {
    return { time: adjustment[1], offset: adjustment[3] }
  }));
}

KeyField = "k=" key:$KeyType EOL {
  return key;
}



SessionAttributeFields = attrs:(SessionAttributeLine)*
MediaAttributeFields = attrs:(MediaAttributeLine)*


SessionAttributeLine = RtcpFbLine
                     / RtpMapLine
                     / ExtmapLine
                     / SSRCLine
                     / SSRCGroupLine
                     / GroupLine
                     / CnameLine
                     / PreviousSSRCLine
                     / DirectionLine
                     / FingerprintLine
                     / IcePwdLine
                     / IceUfragLine
                     / IceLiteLine
                     / IceMismatchLine
                     / IceOptionsLine
                     / GenericAttributeLine

MediaAttributeLine = RtcpFbLine
                   / RtpMapLine
                   / RtcpLine
                   / ExtmapLine
                   / SSRCLine
                   / SSRCGroupLine
                   / GroupLine
                   / CnameLine
                   / PreviousSSRCLine
                   / DirectionLine
                   / FingerprintLine
                   / CandidateLine
                   / IcePwdLine
                   / IceUfragLine
                   / IceOptionsLine
                   / FmtpLine
                   / MaxPacketTimeLine
                   / RtcpMuxLine
                   / RemoteCandidateLine
                   / GenericAttributeLine


GenericAttributeLine = "a=" attr:attribute EOL {
  return attr;
}

MediaDescriptions = all:MediaDescription*
MediaDescription = m:MediaLine info:InformationField? connections:ConnectionField* bandwidths:BandwidthFields key:KeyField? attrs:MediaAttributeFields {
  var desc = {
    type: m.media,
    formats: m.formats,
    port: m.port,
    protocol: m.protocol,
    attrs: attrs,
  };

  if (m.numberOfPorts) {
    desc.numberOfPorts = m.numberOfPorts;
  }

  if (info) {
    desc.info = info;
  }

  if (key) {
    desc.key = key;
  }

  if (connections.length) {
    desc.connections = connections;
  }

  if (bandwidths) {
    desc.bandwidths = bandwidths;
  }

  return desc;
}

// https://tools.ietf.org/html/rfc4566#section-5.14
MediaLine = "m=" a:media SP b:port c:("/" integer)? SP d:proto e:(SP fmt)+ EOL {
  var m = {
    type: 'mediaLine',
    formats: extractFirst(e),
    protocol: d,
    media: a,
    port: b,
  };

  if (c) {
    m.numberOfPorts = c[1];
  }

  return m;
}

/**
 * sub-rules of 'o='
 */

 // pretty wide definition, but doesn't include space
username = NonWsString

// should be unique for this username/host
SessId = DIGIT+ {
  return parseInt(text(), 10);
}


SessVersion = DIGIT+ {
  return parseInt(text(), 10);
}

// typically "IN"
nettype = $token

// typically "IP4" or "IP6"
addrtype = $token

TokenChar = "\x21"
          / [\x23-\x27]
          / [\x2A-\x2B]
          / [\x2D-\x2E]
          / [\x30-\x39]
          / [\x41-\x5A]
          / [\x5E-\x7E]

token = $TokenChar+

integer = POSDIGIT DIGIT* {
  return parseInt(text(), 10);
}

POSDIGIT = [\x31-\x39] //  1 - 9

AlphaNumeric = ALPHA / DIGIT

// string of visible characters
NonWsString = $(VCHAR / [\x80-\xFF])+


// Glossing over strict address parsing for now
UnicastAddress =     FakeAddress
MulticastAddress =   FakeAddress

FakeAddressChar = [a-z0-9\/\-\.];
FakeAddress = $(!EOL FakeAddressChar)+


/**
 * sub-rules of 'p='
 */
PhoneNumber = phone SP* "(" EmailSafe+ ")"
            / EmailSafe+ "<" phone ">"
            / phone

phone = "+"? DIGIT (SP / "-" / DIGIT)+

/**
 * sub-rules of 'c='
 */
ConnectionAddress =  MulticastAddress / UnicastAddress

//  sub-rules of 'b='
bwtype = token

bandwidth = DIGIT+ {
  // in kilobits per second
  return parseInt(text(), 10);
}

//  sub-rules of 't='
StartTime = time / "0"

StopTime = time / "0"

//  Decimal representation of NTP time in
//  seconds since 1900.  The representation
//  of NTP time is an unbounded length field
//  containing at least 10 digits.  Unlike the
//  64-bit representation used elsewhere, time
//  in SDP does not wrap in the year 2036.
time = $(POSDIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT)

//  sub-rules of 'r=' and 'z='
RepeatInterval = $(POSDIGIT DIGIT* FixedLenTimeUnit)
               / POSDIGIT DIGIT* { return parseInt(text(), 10); }

TypedTime = $(DIGIT+ FixedLenTimeUnit)
          / DIGIT+ { return parseInt(text(), 10); }

FixedLenTimeUnit = "\x64" / "\x68" / "\x6d" / "\x73"

//  sub-rules of 'k='
KeyType = "prompt"
        / "clear:" text
        / "base64:" base64
        / "uri:" uri

base64      = Base64Unit* Base64Pad?
Base64Unit  = Base64Char4
Base64Pad   = Base64Char2 "==" / Base64Char3 "="
Base64Char4 = Base64Char Base64Char Base64Char Base64Char
Base64Char3 = Base64Char Base64Char Base64Char
Base64Char2 = Base64Char Base64Char
Base64Char  = ALPHA / DIGIT / "+" / "/"

//  sub-rules of 'a='
attribute = name:AttField ":" value:AttValue {
            return {
              type: name.trim(),
              value: value.trim()
            };
          }
          / name:AttField {
            return {
              type: name.trim()
            };
          }

AttField = token
AttValue = ByteString

/**
 * Media Stream Identification (MID) Attribute
 * https://tools.ietf.org/html/rfc5888#section-4
 * e.g. a=mid:audio
 */
MidLine = "a=mid:" id:identificationTag EOL {
  return {
    type: 'mid',
    idTag: id,
  };
}


/**
 * Group Attribute
 * https://tools.ietf.org/html/rfc5888#section-5
 * e.g. a=group:BUNDLE audio video
 */
GroupLine = "a=group:" s:groupSemantics idTags:(SP identificationTag)* EOL {
  return {
    type: 'group',
    value: {
      semantics: s,
      idTags: extractFirst(idTags),
    },
  }
}

groupSemantics = "LS"
          / "FID"
          / $(semanticsExtension)
semanticsExtension = token;


/**
 * Real Time Control Protocol (RTCP) attribute in Session Description Protocol (SDP)
 * https://tools.ietf.org/html/rfc3605
 * e.g. a=rtcp:9 IN IP4 0.0.0.0
 */

RtcpLine = "a=rtcp:" a:port details:(SP nettype SP addrtype SP $ConnectionAddress)? EOL {
  const line = {
    type: 'rtcp',
    value: {
      port: a,
    },
  };

  if (details) {
    line.value.netType = details[1];
    line.value.addrType = details[3];
    line.value.address = details[5];
  }

  return line;
}

/*a=rtpmap:<payload type> <encoding name>/<clock rate> [/<encoding parameters>]*/
RtpMapLine = "a=rtpmap:" format:fmt SP encodingName:token "/" clockRate:integer encodingParams:("/" token)? EOL {
  const line = {
    type: "rtpmap",
    value: {
      format: format,
      encodingName: encodingName,
      clockRate: clockRate,
    },
  };

  if (encodingParams) {
    line.value.encodingParams = encodingParams[1];
  }

  return line;
}

DirectionLine = "a=" direction:direction EOL {
  return {
    type: "direction",
    value: direction,
  };
}


/**
 * Connection-Oriented Media Transport over the Transport Layer Security
 * (TLS) Protocol in the Session Description Protocol (SDP)
 * https://tools.ietf.org/html/rfc4572
 */

FingerprintLine = "a=fingerprint:" hashFunc:hashFunc SP fingerprint:fingerprint EOL {
  return {
    type: 'fingerprint',
    value: {
      hashFunction: hashFunc,
      fingerprint: fingerprint,
    },
  };
}

// Additional hash functions can only come from updates to RFC 3279
hashFunc =  "sha-1" / "sha-224" / "sha-256" / "sha-384"
         / "sha-512" / "md5" / "md2" / token

// Each byte in upper-case hex, separated by colons.
fingerprint =  $(HEXDIG HEXDIG (":" HEXDIG HEXDIG)*)

/**
 * Interactive Connectivity Establishment (ICE): A Protocol for Network
 * Address Translator (NAT) Traversal for Offer/Answer Protocols
 * http://tools.ietf.org/html/rfc5245#section-15
 * e.g.
 *   a=candidate:1 1 UDP 2130706431 10.0.1.1 8998 typ host
 *   a=candidate:2 1 UDP 1694498815 192.0.2.3 45664 typ srflx raddr 10.0.1.1 rport 8998
 */
CandidateLine = "a=candidate:" a:Foundation SP b:ComponentId SP c:Transport SP
                                d:Priority SP e:ConnectionAddress SP f:port SP
                                g:CandType h:(SP RelAddr)? i:(SP RelPort)?
                                j:(SP ExtensionAttName SP ExtensionAttValue)* EOL {

  var candidate = {
    type: 'candidate',
    value: {
      foundation: a,
      componentId: b,
      transport: c,
      priority: d,
      address: e,
      port: f,
      candidateType: g,
      extensions: j.map((ext) => {
        return {name: ext[1], value: ext[3]};
      }),
    },
  };

  if (h) {
    candidate.value.relAddr = h[1];
  }

  if (i) {
    candidate.value.relPort = i[1];
  }

  return candidate;
}

// @fixme This is incorrect, the actual definition should be 1*32ice-char. Limiting
// the number of repeats of a sequence isn't directly supported in PEG.js yet.
// The following is 1 or more, rather than between 1 and 32.
Foundation = $IceChar+
ComponentId = $DIGIT1_5
Transport = "UDP" / TransportExtension
TransportExtension = token
Priority = $DIGIT1_10
CandType = "typ" SP type:CandidateTypes { return type; }
CandidateTypes = "host" / "srflx" / "prflx" / "relay" / token
RelAddr = "raddr" SP addr:ConnectionAddress { return addr; }
RelPort = "rport" SP port:port { return port; }
ExtensionAttName = ByteString
ExtensionAttValue = ByteString




/**
 * "ice-ufrag" and "ice-pwd" Attributes
 * See http://tools.ietf.org/html/rfc5245#section-15.4
 */

IcePwdLine = "a=ice-pwd:" passwd:password EOL {
  return {
    type: 'ice-pwd',
    value: passwd,
  };
}

IceUfragLine = "a=ice-ufrag:" ufrag:ufrag EOL {
  return {
    type: 'ice-ufrag',
    value: ufrag,
  };
}

// @fixme This is incorect, the actual definition should be 22*256IceChar. Limiting
// the number of repeats of a sequence isn't directly supported in PEG.js yet.
// The following is 22 or more, rather than between 22 and 256.
password = $(IceChar8 IceChar8 IceChar4 IceChar IceChar+)

// @fixme This is incorrect, the actual definition should be 4*256IceChar. Limiting
// the number of repeats of a sequence isn't directly supported in PEG.js yet.
// The following is 4 or more, rather than between 4 and 256.
ufrag = $(IceChar IceChar IceChar IceChar+)

 IceChar32 = IceChar16 IceChar16
 IceChar16 = IceChar8 IceChar8
 IceChar8 = IceChar4 IceChar4
 IceChar4 = IceChar2 IceChar2
 IceChar2 = IceChar IceChar
 IceChar = ALPHA / DIGIT / "+" / "/"

/**
 * "ice-lite" and "ice-mismatch" Attributes
 * http://tools.ietf.org/html/rfc5245#section-15.3
 * Session-level only
 */
IceLiteLine = "a=ice-lite" EOL {
  return {
    type: 'ice-lite',
  };
}

IceMismatchLine = "a=ice-mismatch" EOL {
  return {
    type: 'ice-mismatch',
  };
}


/**
 * "ice-options" Attribute
 * http://tools.ietf.org/html/rfc5245#section-15.5
 * https://tools.ietf.org/html/draft-ietf-mmusic-ice-sip-sdp-07#section-9.6
 * Session and media level
 */

IceOptionsLine = "a=ice-options:" first:IceOptionTag rest:(SP IceOptionTag)* EOL {
  return {
    type: 'ice-options',
    value: [first].concat(extractFirst(rest)),
  };
}
IceOptionTag = $IceChar+

/**
 * "remote-candidates" Attribute
 * http://tools.ietf.org/html/rfc5245#section-15.2
 * Media-level only
 */
RemoteCandidateLine = "a=remote-candidates:" first:RemoteCandidate rest:(SP RemoteCandidate)* EOL {
  return {
    type: 'remote-candidates',
    value: [first].concat(extractFirst(rest)),
  };
}

RemoteCandidate = id:ComponentId SP addr:ConnectionAddress SP port:port {
  return {
    componentId: id,
    address: addr,
    port: port,
  };
}


/**
 * fmtp attribute
 * http://tools.ietf.org/html/rfc2327#section-6
 * a=fmtp:<format> <format specific parameters>
 * E.g. a=fmtp:96 apt=100
 * Media-level only
 */
FmtpLine = "a=fmtp:" format:fmt maybeParams:(SP+ $atext+)+ EOL {
  const params = extractFirst(maybeParams);
  const line = {
    type: 'fmtp',
    value: {
      format: format,
    },
  };

  if (params.length) {
    line.value.params = params;
  }

  return line;
}


/**
 * Source-Specific Media Attributes in the Session Description Protocol (SDP)
 * See https://tools.ietf.org/html/rfc5576
 */

// The base definition of "attribute" is in RFC 4566. (It is the content of "a=" lines.)
SSRCLine = "a=ssrc:" id:SSRCId SP attr:attribute EOL {
  return {
    type: "ssrc",
    value: {
      id: id,
      attribute: attr,
    },
  };
}

SSRCGroupLine = "a=ssrc-group:" semantics:semantics ids:(SP SSRCId)* EOL {
  return {
    type: "ssrc-group",
    value: {
      semantics: semantics,
      ids: extractFirst(ids),
    },
  };
}

CnameLine = "a=cname:" cname:cname EOL {
  return {
    type: "cname",
    value: cname,
  };
}

PreviousSSRCLine = "a=previous-ssrc:" id:SSRCId previousIds:(SP SSRCId)* EOL {
  return {
    type: "cname",
    value: {
      id: id,
      previousIds: extractFirst(previousIds),
    },
  };
}

// 0 .. 2**32 - 1
SSRCId = integer

// Matches RFC 3388 definition and IANA registration rules in this doc.
semantics = "FEC" / "FID" / token

// Following the syntax conventions for CNAME as defined in RFC 3550.
// The definition of "ByteString" is in RFC 4566.
cname = ByteString

/**
 * A General Mechanism for RTP Header Extensions
 * See http://tools.ietf.org/html/rfc5285
 * a=extmap:<value>["/"<direction>] <URI> <extensionattributes>
 */

ExtmapLine = "a=extmap:" value:$DIGIT+ direction:("/" direction)? SP extension:extensionname extensionAttrs:(SP ExtensionAttributes)? EOL {
  var line =  {
    type: 'extmap',
    value: {
      value: value,
      extension: extension,
    },
  };

  if (direction) {
    line.value.direction = direction[1];
  }

  if (extensionAttrs) {
    line.value.extensionAttrs = extensionAttrs[1]
  }

  return line;
}

extensionname = $URI
direction = "sendonly" / "recvonly" / "sendrecv" / "inactive"
ExtensionAttributes = ByteString


/**
 * sub-rules for Extended RTP Profile for Real-time Transport Control Protocol (RTCP)-Based Feedback (RTP/AVPF)
 * See https://tools.ietf.org/html/rfc4585
 */

RtcpFbLine = "a=rtcp-fb:" format:RtcpFbPt SP feedback:RtcpFbVal? EOL {
  const line =  {
    type: "rtcp-fb",
    value: {
      format: format,
    },
  };

  if (feedback) {
    line.value.feedback = feedback;
  }

  return line;
}

RtcpFbPt = "*"   // wildcard: applies to all formats
         / fmt   // as defined in SDP spec

RtcpFbVal = "ack" params:RtcpFbAckParam? {
            return typeWithParams("ack", params);
          }
           / "nack" params:RtcpFbNackParam? {
             return typeWithParams("nack", params);
           }
           / "trr-int" SP param:DIGIT+ {
             return typeWithParams("trr-int", param);
           }
           / type:RtcpFbId? params:RtcpFbParam? {
             return typeWithParams(type, params);
           }

RtcpFbId = $(AlphaNumeric / "-" / "_")+

RtcpFbParam = SP "app" additional:(SP ByteString)? {
              return ["app"].concat(additional ? additional[1] : []);
            }
            / SP param:token additional:(SP ByteString)? {
              return [param].concat(additional ? additional[1] : []);
            }
            // // empty

RtcpFbAckParam = SP "rpsi" { return ["rpsi"]; }
               / SP "app" additional:(SP ByteString)? {
                 return ["app"].concat(additional ? additional[1] : []);
               }
               / SP param:token additional:(SP ByteString)? {
                 return [param].concat(additional ? additional[1] : []);
               }
               // // empty

RtcpFbNackParam = SP "pli" { return ["pli"]; }
                 / SP "sli" { return ["sli"]; }
                 / SP "rpsi" { return ["rpsi"]; }
                 / SP "app" additional:(SP ByteString)? {
                   return ["app"].concat(additional ? additional[1] : []);
                 }
                 / SP param:token additional:(SP ByteString)? {
                   return [param].concat(additional ? additional[1] : []);
                 }
                 // ; empty



/**
* Max Packet Time attribute
* See https://tools.ietf.org/html/rfc4566
* a=maxptime:<maximum packet time>
* Media-level only
*/
MaxPacketTimeLine = "a=maxptime:" maxptime:integer EOL {
 return {
   type: 'maxptime',
   value: maxptime,
 };
}

/**
* rtcp-mux attribute
* See https://tools.ietf.org/html/rfc5761
* Media-level only
*/
RtcpMuxLine = "a=rtcp-mux" EOL {
 return { type: 'rtcp-mux' };
}


/**
 * sub-rules of 'u='
 */

uri = URI_reference

/**
 * Uniform Resource Identifier (URI): Generic Syntax
 * Implements RFC 3986.
 *
 * See:
 *  * https://tools.ietf.org/html/rfc3986
 *  * https://github.com/for-GET/core-pegjs/blob/master/src/ietf/rfc3986-uri.pegjs
 *
 */


/* http://tools.ietf.org/html/rfc3986#section-2.1 Percent-Encoding */
pct_encoded
  = $("%" HEXDIG HEXDIG)


/* http://tools.ietf.org/html/rfc3986#section-2.2 Reserved Characters */
reserved
  = gen_delims
  / sub_delims

gen_delims
  = ":"
  / "/"
  / "?"
  / "#"
  / "["
  / "]"
  / "@"

sub_delims
  = "!"
  / "$"
  / "&"
  / "'"
  / "("
  / ")"
  / "*"
  / "+"
  / ","
  / ";"
  / "="


/* http://tools.ietf.org/html/rfc3986#section-2.3 Unreserved Characters */
unreserved
  = ALPHA
  / DIGIT
  / "-"
  / "."
  / "_"
  / "~"


/* http://tools.ietf.org/html/rfc3986#section-3 Syntax Components */
URI
  = scheme ":" hier_part ("?" query)? ("#" fragment)?

hier_part
  = "//" authority path_abempty
  / path_absolute
  / path_rootless
  / path_empty


/* http://tools.ietf.org/html/rfc3986#section-3.1 Scheme */
scheme
  = $(ALPHA (ALPHA / DIGIT / "+" / "-" / ".")*)


/* http://tools.ietf.org/html/rfc3986#section-3.2 Authority */
// CHANGE host to hostname
authority
  = (userinfo "@")? hostname (":" port)?


/* http://tools.ietf.org/html/rfc3986#section-3.2.1 User Information */
userinfo
  = $(unreserved / pct_encoded / sub_delims / ":")*


/* http://tools.ietf.org/html/rfc3986#section-3.2.2 Host */
// CHANGE host to hostname
// CHANGE Add forward check for reg_name
hostname
  = IP_literal !reg_name_item_
  / IPv4address !reg_name_item_
  / reg_name

IP_literal
  = "[" (IPv6address / IPvFuture) "]"

IPvFuture
  = "v" $(HEXDIG+) "." $( unreserved
                        /*
                        // CHANGE Ignore due to https://github.com/for-GET/core-pegjs/issues/8
                        / sub_delims
                        */
                        / ":"
                        )+

IPv6address
  = $(                                                            h16_ h16_ h16_ h16_ h16_ h16_ ls32
     /                                                       "::"      h16_ h16_ h16_ h16_ h16_ ls32
     / (                                               h16)? "::"           h16_ h16_ h16_ h16_ ls32
     / (                               h16_?           h16)? "::"                h16_ h16_ h16_ ls32
     / (                         (h16_ h16_?)?         h16)? "::"                     h16_ h16_ ls32
     / (                   (h16_ (h16_ h16_?)?)?       h16)? "::"                          h16_ ls32
     / (             (h16_ (h16_ (h16_ h16_?)?)?)?     h16)? "::"                               ls32
     / (       (h16_ (h16_ (h16_ (h16_ h16_?)?)?)?)?   h16)? "::"                               h16
     / ( (h16_ (h16_ (h16_ (h16_ (h16_ h16_?)?)?)?)?)? h16)? "::"
     )

ls32
  // least_significant 32 bits of address
  = h16 ":" h16
  / IPv4address

h16_
  = h16 ":"

h16
  // 16 bits of address represented in hexadecimal
  = $(HEXDIG (HEXDIG (HEXDIG HEXDIG?)?)?)

IPv4address
  = $(dec_octet "." dec_octet "." dec_octet "." dec_octet)

// CHANGE order in reverse for greedy matching
dec_octet
  = $( "25" [\x30-\x35]      // 250-255
     / "2" [\x30-\x34] DIGIT // 200-249
     / "1" DIGIT DIGIT       // 100-199
     / [\x31-\x39] DIGIT     // 10-99
     / DIGIT                 // 0-9
     )

reg_name
  = $(reg_name_item_*)
reg_name_item_
  = unreserved
  / pct_encoded
  /*
  // CHANGE Ignore due to https://github.com/for-GET/core-pegjs/issues/8
  / sub_delims
  */


/* http://tools.ietf.org/html/rfc3986#section-3.2.3 Port */
port = DIGIT* {
  return parseInt(text(), 10);
}


/* http://tools.ietf.org/html/rfc3986#section-3.3 Path */
path
  = path_abempty  // begins with "/" or is empty
  / path_absolute // begins with "/" but not "//"
  / path_noscheme // begins with a non_colon segment
  / path_rootless // begins with a segment
  / path_empty    // zero characters

path_abempty
  = $("/" segment)*

path_absolute
  = $("/" (segment_nz ("/" segment)*)?)

path_noscheme
  = $(segment_nz_nc ("/" segment)*)

path_rootless
  = $(segment_nz ("/" segment)*)

path_empty
  = ""

segment
  = $(pchar*)

segment_nz
  = $(pchar+)

segment_nz_nc
  // non_zero_length segment without any colon ":"
  = $(unreserved / pct_encoded / sub_delims / "@")+

pchar
  = unreserved
  / pct_encoded
  / sub_delims
  / ":"
  / "@"


/* http://tools.ietf.org/html/rfc3986#section-3.4 Query */
query
  = $(pchar / "/" / "?")*


/* http://tools.ietf.org/html/rfc3986#section-3.5 Fragment */
fragment
  = $(pchar / "/" / "?")*


/* http://tools.ietf.org/html/rfc3986#section-4.1 URI Reference */
URI_reference
  = URI
  / relative_ref


/* http://tools.ietf.org/html/rfc3986#section-4.2 Relative Reference */
relative_ref
  = relative_part ("?" query)? ("#" fragment)?

relative_part
  = "//" authority path_abempty
  / path_absolute
  / path_noscheme
  / path_empty


/* http://tools.ietf.org/html/rfc3986#section-4.3 Absolute URI */
absolute_URI
  = scheme ":" hier_part ("?" query)?

/**
 * sub-rules of 'e=', see RFC 2822 for definitions
 */

EmailAddress = AddressAndComment
              / DispnameAndAddress
              / AddrSpec

AddressAndComment  = AddrSpec "(" EmailSafe+ ")"
DispnameAndAddress = EmailSafe+ "<" AddrSpec ">"


// any byte except NUL, CR, LF, or the quoting characters ()<>
EmailSafe = AlphaNumeric
          / "'" / "'" / "-" / "."
          / "/" / ":" / "?" / "\""
          / "#" / "$" / "&" / "*"
          / ";" / "=" / "@" / "["
          / "]" / "^" / "_" / "`"
          / "{" / "|" / "}" / "+"
          / "~" / SP / HTAB


/**
 * sub-rules of 'm='
 */

// typically "audio", "video", "text", or "application"
media = token

// typically an RTP payload type for audio and video media
fmt = token

// typically "RTP/AVP" or "udp"
proto = $(token ("/" token)*)

/**
 * AddrSpec: from RFC 2822
 *
 * See https://tools.ietf.org/html/rfc2822#section-3.4.1
 *
 */

AddrSpec = LocalPart "@" domain

LocalPart = DotAtom
          / QuotedString
          / ObsLocalPart

domain = DotAtom
       / DomainLiteral
       / ObsDomain

DomainLiteral = CFWS? "[" *(FWS? dcontent) FWS? "]" CFWS?

dcontent = dtext / QuotedPair

dtext = NoWsCtl         //  Non white space controls
      /  [\d33-\d90]     //  The rest of the US-ASCII
      /  [\d94-\d126]    //   characters not including "[",
                          //   "]", or "\"

NoWsCtl = [\d1-\d8]        //  US-ASCII control characters
        / "\d11"           //   that do not include the
        / "\d12"           //   carriage return, line feed,
        / [\d14-\d31]      //   and white space characters
        / "\d127"


text = [\d1-\d9]          // Characters excluding CR and LF
     / "\d11"
     / "\d12"
     / [\d14-\d127]
     // ObsText   // Disabled this as it causes infinite loops (probably due to infinite left recursion)


/**
 * Quoted strings
 */
QuotedPair = ("\\" text) / ObsQp

qtext = NoWsCtl           // Non white space controls
      / "\d33"            // The rest of the US-ASCII
      / [\d35-\d91]       // characters not including "\"
      / [\d93-\d126]      //  or the quote character

qcontent = text / QuotedPair

QuotedString = CFWS? DQUOTE (FWS? qcontent)* FWS? DQUOTE CFWS?


/**
 * Miscellaneous obsolete tokens
 *
 * See https://tools.ietf.org/html/rfc2822#section-4.1
 *
 */
ObsQp = "\\" [\d0-\d127]

ObsText = LF* CR* (ObsChar LF* CR*)*

ObsChar = [\d0-\d9] / "\d11"              //  [\xd0-\x127] except CR and
        / "\d12" / [\d14-\d127]           //   LF

ObsUtext = ObsText

ObsPhrase = word (word / "." / CFWS)*

ObsPhraseList = phrase
              / (phrase? CFWS? "," CFWS?)+ phrase?

ObsDomain = atom ("." atom)*

ObsLocalPart = word ("." word)*

ObsFWS = WSP+ (EOL WSP+)*

/**
 * Folding white space and comments
 *
 * See https://tools.ietf.org/html/rfc2822#section-3.2.3
 */

//  Folding white space
FWS =  ((WSP* CRLF)? WSP+)
    / ObsFWS

ctext = NoWsCtl        //  Non white space controls
      / [\d33-\d39]    //  The rest of the US-ASCII
      / [\d42-\d91]    //   characters not including "(",
      / [\d93-\d126]   //   ")", or "\"

ccontent = ctext
         / QuotedPair
         / comment

comment = "(" (FWS? ccontent)* FWS? ")"

CFWS = (FWS? comment)* ((FWS? comment) / FWS)


word = atom / QuotedString

phrase = word+ / ObsPhrase

utext = NoWsCtl          // Non white space controls
      / [\d33-\d126]    // The rest of US-ASCII
      / ObsUtext

//unstructured = (FWS? utext)* FWS?

/**
* Atom
*/

atext = ALPHA / DIGIT    // Any character except controls,
     / "!" / "#"        //  SP, and specials.
     / "$" / "%"        //  Used for atoms
     / "&" / "'"
     / "*" / "+"
     / "-" / "/"
     / "=" / "?"
     / "^" / "_"
     / "`" / "{"
     / "|" / "}"
     / "~"

atom = CFWS? atext+ CFWS?

DotAtom = CFWS? DotAtomText CFWS?

DotAtomText = atext+ ("." atext+)*

identificationTag = token

DIGIT1_10 = DIGIT DIGIT? DIGIT? DIGIT? DIGIT? DIGIT? DIGIT? DIGIT? DIGIT? DIGIT? { return text(); }
DIGIT1_5 = DIGIT DIGIT? DIGIT? DIGIT? DIGIT? { return text(); }

/**
 * generic sub-rules: datatypes
 */

// default is to interpret this as UTF8 text.
// ISO 8859-1 requires "a=charset:ISO-8859-1"
// session-level attribute to be used
text = ByteString

// any byte except NUL, CR, or LF
ByteString = $Byte+
Byte = [\x01-\x09]
     / [\x0B-\x0C]
     / [\x0E-\xFF]

/**
 * Generic ABNF primitives
 */
HEXDIG
  = DIGIT
  / "A"i
  / "B"i
  / "C"i
  / "D"i
  / "E"i
  / "F"i

VCHAR = [\x21-\x7E]
ALPHA = [a-zA-Z]
DIGIT = [0-9]
DQUOTE = [\x22]
HTAB = "\x09"
WSP = SP / HTAB
EOL   = CRLF / LF
CRLF  = CR LF
CR    = "\x0D"
LF    = "\x0A"
SP    = "\x20"
