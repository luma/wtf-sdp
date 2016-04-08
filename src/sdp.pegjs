/*
 * Session Description Protocol (SDP) grammar
 * ==========================================
 *
 * See https://tools.ietf.org/html/rfc4566
 */

SessionDescription = a:ProtoVersion b:OriginField c:SessionNameField d:InformationField?
                     e:UriField? f:EmailFields? g:PhoneFields? h:ConnectionField?
                     i:BandwidthFields j:TimeFields k:KeyField? l:AttributeFields
                     m:MediaDescriptions {

  var sdp = {
    version: a,
    origin: b,
    sessionName: c,
    times: j.value,
    attributes: l,
    media: m
  };

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
    sessionId: b,
    sessionVersion: c,
    netType: d,
    addressType: e,
    address: f,
  };
}

SessionNameField = "s=" sessionName:text EOL {
  return sessionName;
}

InformationField = "i=" value:text EOL {
  return {
  	type: 'info',
    value: value,
  };
}


UriField = "u=" uri:$uri EOL {
  return {
  	type: 'uri',
    value: uri,
  };
}

EmailFields = emails:("e=" $EmailAddress EOL)*  {
  if (emails.length === 0) {
    return void 0;
  }

  return {
  	type: 'email',
    value: emails.map(function(email) { return email[1]; }),
  };
}

PhoneFields = phoneNumbers:("p=" $PhoneNumber EOL)* {
  if (phoneNumbers.length === 0) {
    return void 0;
  }

  return {
  	type: 'phone',
    value: phoneNumbers.map(function(phone) { return phone[1]; }),
  };
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

BandwidthFields = bandwidths:("b=" bwtype ":" bandwidth EOL)* {
  if (bandwidths.length === 0) {
    return void 0;
  }

  return {
  	type: 'bandwidths',
    value: bandwidths.map(function(bandwidth) {
      return {
        type: bandwidths[1],
        value: bandwidths[3],
      };
    }),
  };
}

TimeFields = times:TimeField+ z:(ZoneAdjustments EOL)? {
  var timeFields =  {
  	type: 'times',
    times: times,
  };

  if (z) {
    timeFields.zoneAdjustments =z[0];
  }

  return timeFields;
}

TimeField = "t=" a:StartTime SP b:StopTime r:(EOL RepeatFields)* EOL {
  return {
    start: a,
    stop: b,
    repeats: r.map(function(repeat) { return repeat[1]; })
  };
}

// r=<repeat interval> <active duration> <offsets from start-time>
// https://tools.ietf.org/html/rfc4566#section-5.10
RepeatFields =  "r=" interval:RepeatInterval SP activeDuration:TypedTime offsets:(SP TypedTime)+ {
  return {
    type: 'repeat',
    interval: interval,
    activeDuration: activeDuration,
    offsets: offsets.map(function(offset) { return offset[1]; })
  }
}

// z=<adjustment time> <offset> <adjustment time> <offset> ....
// https://tools.ietf.org/html/rfc4566#section-5.11
ZoneAdjustments = "z=" time:time SP offset:$("-"? TypedTime) rest:(SP time SP $("-"? TypedTime))* {
  var adjustments = [
    { time: time, offset: offset}
  ].concat(rest.map(function(adjustment) {
    return { time: adjustment[1], offset: adjustment[3] }
  }));

  return {
    type: 'zoneAdjustments',
    adjustments: adjustments
  };
}

KeyField = "k=" key:$KeyType EOL {
  return {
    type: 'key',
    value: key
  };
}

AttributeFields = attrs:("a=" attribute EOL)* {
  return attrs.map(function(attr) { return attr[1]; });
}

MediaDescriptions = all:MediaDescription*
MediaDescription = m:MediaLine info:InformationField? connections:ConnectionField* bandwidths:BandwidthFields key:KeyField? attrs:AttributeFields {
  var desc = {
    type: m.media,
    formats: m.formats,
    port: m.port,
    attrs: attrs,
  };

  if (m.numberOfPorts) {
    desc.numberOfPorts = m.numberOfPorts;
  }

  if (m.info) {
    desc.info = info;
  }

  if (m.key) {
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
    formats: e.map(function(fmt) { return fmt[1]; }),
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
bwtype =              token

bandwidth =           DIGIT+

//  sub-rules of 't='
StartTime =          time / "0"

StopTime =           time / "0"

//  Decimal representation of NTP time in
//  seconds since 1900.  The representation
//  of NTP time is an unbounded length field
//  containing at least 10 digits.  Unlike the
//  64-bit representation used elsewhere, time
//  in SDP does not wrap in the year 2036.
time = POSDIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT DIGIT

//  sub-rules of 'r=' and 'z='
RepeatInterval = $(POSDIGIT DIGIT* FixedLenTimeUnit?)

TypedTime = $(DIGIT+ FixedLenTimeUnit?)

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
              type: 'attribute',
              name: name.trim(),
              value: value.trim()
            };
          }
          / name:AttField {
            return {
              type: 'attribute',
              name: name.trim()
            };
          }

AttField = token
AttValue = ByteString



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

AddressAndComment  = AddrSpec SP+ "(" EmailSafe+ ")"
DispnameAndAddress = EmailSafe+ SP+ "<" AddrSpec ">"


// any byte except NUL, CR, LF, or the quoting characters ()<>
EmailSafe = [\x01-\x09]
          / [\x0B-\x0C]
          / [\x0E-\x27]
          / [\x2A-\x3B]
          / "\x3D"
          / [\x3F-\xFF]


/**
 * sub-rules of 'm='
 */

// typically "audio", "video", "text", or "application"
media = token

// typically an RTP payload type for audio and video media
fmt = token

// typically "RTP/AVP" or "udp"
proto = token ("/" token)*

/**
 * AddrSpec: from RFC 2822
 *
 * See https://tools.ietf.org/html/rfc2822#section-3.4.1
 *
 */

AddrSpec = LocalPart "@" domain

LocalPart = DotAtom
//          / QuotedString
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
     / ObsText


/**
 * Quoted strings
 */
QuotedPair = ("\\" text) / ObsQp

qtext = NoWsCtl           // Non white space controls
      / "\d33"            // The rest of the US-ASCII
      / [\d35-\d91]       // characters not including "\"
      / [\d93-\d126]      //  or the quote character

qcontent = text / QuotedPair

//QuotedString = CFWS? DQUOTE (FWS? qcontent)* FWS? DQUOTE CFWS?


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


word = atom // QuotedString

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

/**
 * generic sub-rules: datatypes
 */

// default is to interpret this as UTF8 text.
// ISO 8859-1 requires "a=charset:ISO-8859-1"
// session-level attribute to be used
text = ByteString

// any byte except NUL, CR, or LF
ByteString = $([\x01-\x09] / [\x0B-\x0C] / [\x0E-\xFF])+


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
ALPHA = [\x41-\x5A] / [\x61-\x7A]
DIGIT = [\x30-\x39]
DQUOTE = [\x22]
HTAB = "\x09"
WSP = SP / HTAB
EOL   = CRLF / LF
CRLF  = CR LF
CR    = "\x0D"
LF    = "\x0A"
SP    = "\x20"
