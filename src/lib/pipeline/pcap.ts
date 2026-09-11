/**
 * pcap_adapter — classic libpcap (.pcap) and pcapng reader.
 * Decodes Ethernet II / IPv4 / IPv6-lite / TCP / UDP / ICMP headers only.
 * No payload is retained; nothing is executed from the capture.
 */
import { emptyFlags, PipelineError, type ParsedPacket, type TcpFlags } from "./types";

const PCAP_MAGIC_LE = 0xd4c3b2a1;
const PCAP_MAGIC_BE = 0xa1b2c3d4;
const PCAP_MAGIC_NS_LE = 0x4d3cb2a1;
const PCAP_MAGIC_NS_BE = 0xa1b23c4d;
const PCAPNG_MAGIC = 0x0a0d0d0a;

const ipv4 = (v: DataView, off: number) =>
  `${v.getUint8(off)}.${v.getUint8(off + 1)}.${v.getUint8(off + 2)}.${v.getUint8(off + 3)}`;

const ipv6 = (v: DataView, off: number) => {
  const parts: string[] = [];
  for (let i = 0; i < 8; i++) parts.push(v.getUint16(off + i * 2).toString(16));
  return parts.join(":");
};

function decodeFlags(bits: number): TcpFlags {
  return {
    fin: bits & 0x01 ? 1 : 0,
    syn: bits & 0x02 ? 1 : 0,
    rst: bits & 0x04 ? 1 : 0,
    psh: bits & 0x08 ? 1 : 0,
    ack: bits & 0x10 ? 1 : 0,
    urg: bits & 0x20 ? 1 : 0,
  };
}

/** Decode one link-layer frame into a ParsedPacket, or null when unsupported. */
function decodeFrame(
  view: DataView,
  start: number,
  capLen: number,
  linkType: number,
  tsMs: number,
): ParsedPacket | null {
  let off = start;
  let etherType: number;

  if (linkType === 1) {
    if (capLen < 14) return null;
    etherType = view.getUint16(off + 12);
    off += 14;
    // Unwrap up to two VLAN tags.
    for (let i = 0; i < 2 && (etherType === 0x8100 || etherType === 0x88a8); i++) {
      etherType = view.getUint16(off + 2);
      off += 4;
    }
  } else if (linkType === 101 || linkType === 12 || linkType === 228) {
    const version = view.getUint8(off) >> 4;
    etherType = version === 6 ? 0x86dd : 0x0800;
  } else if (linkType === 113) {
    if (capLen < 16) return null;
    etherType = view.getUint16(off + 14);
    off += 16;
  } else {
    return null;
  }

  let srcIp: string;
  let dstIp: string;
  let protoNum: number;
  let ttl: number | null = null;
  let ipPayloadOff: number;
  let totalLength: number;

  if (etherType === 0x0800) {
    if (off + 20 > view.byteLength) return null;
    const ihl = (view.getUint8(off) & 0x0f) * 4;
    totalLength = view.getUint16(off + 2);
    ttl = view.getUint8(off + 8);
    protoNum = view.getUint8(off + 9);
    srcIp = ipv4(view, off + 12);
    dstIp = ipv4(view, off + 16);
    ipPayloadOff = off + ihl;
  } else if (etherType === 0x86dd) {
    if (off + 40 > view.byteLength) return null;
    totalLength = view.getUint16(off + 4) + 40;
    protoNum = view.getUint8(off + 6);
    ttl = view.getUint8(off + 7);
    srcIp = ipv6(view, off + 8);
    dstIp = ipv6(view, off + 24);
    ipPayloadOff = off + 40;
  } else {
    return null;
  }

  let srcPort: number | null = null;
  let dstPort: number | null = null;
  let flags = emptyFlags();
  let seq: number | null = null;
  let headerLen = 0;
  let protocol = "OTHER";

  if (protoNum === 6 && ipPayloadOff + 20 <= view.byteLength) {
    protocol = "TCP";
    srcPort = view.getUint16(ipPayloadOff);
    dstPort = view.getUint16(ipPayloadOff + 2);
    seq = view.getUint32(ipPayloadOff + 4);
    headerLen = (view.getUint8(ipPayloadOff + 12) >> 4) * 4;
    flags = decodeFlags(view.getUint8(ipPayloadOff + 13));
  } else if (protoNum === 17 && ipPayloadOff + 8 <= view.byteLength) {
    protocol = "UDP";
    srcPort = view.getUint16(ipPayloadOff);
    dstPort = view.getUint16(ipPayloadOff + 2);
    headerLen = 8;
  } else if (protoNum === 1 || protoNum === 58) {
    protocol = "ICMP";
  }

  const ipHeaderLen = ipPayloadOff - off;
  const payloadLength = Math.max(0, totalLength - ipHeaderLen - headerLen);

  return {
    tsMs,
    srcIp,
    dstIp,
    srcPort,
    dstPort,
    protocol,
    length: capLen,
    ttl,
    flags,
    seq,
    payloadLength,
  };
}

export interface PcapParseOptions {
  maxPackets?: number;
}

export function parsePcap(buffer: ArrayBuffer, options: PcapParseOptions = {}): ParsedPacket[] {
  const maxPackets = options.maxPackets ?? 400_000;
  if (buffer.byteLength < 24) throw new PipelineError("PARSING", "Capture file is too small to be a valid PCAP.");
  const view = new DataView(buffer);
  const magicBE = view.getUint32(0, false);

  if (magicBE === PCAPNG_MAGIC) return parsePcapNg(view, maxPackets);

  let little: boolean;
  let nanos = false;
  if (magicBE === PCAP_MAGIC_BE) little = false;
  else if (magicBE === PCAP_MAGIC_LE) little = true;
  else if (magicBE === PCAP_MAGIC_NS_BE) {
    little = false;
    nanos = true;
  } else if (magicBE === PCAP_MAGIC_NS_LE) {
    little = true;
    nanos = true;
  } else {
    throw new PipelineError("PARSING", "Unrecognised capture format — expected libpcap or pcapng.");
  }

  const linkType = view.getUint32(20, little);
  const packets: ParsedPacket[] = [];
  let off = 24;

  while (off + 16 <= view.byteLength && packets.length < maxPackets) {
    const tsSec = view.getUint32(off, little);
    const tsFrac = view.getUint32(off + 4, little);
    const capLen = view.getUint32(off + 8, little);
    off += 16;
    if (capLen === 0 || off + capLen > view.byteLength) break;
    const tsMs = tsSec * 1000 + (nanos ? tsFrac / 1e6 : tsFrac / 1000);
    const pkt = decodeFrame(view, off, capLen, linkType, tsMs);
    if (pkt) packets.push(pkt);
    off += capLen;
  }

  if (packets.length === 0) throw new PipelineError("PARSING", "No IPv4/IPv6 packets could be decoded from this capture.");
  return packets;
}

function parsePcapNg(view: DataView, maxPackets: number): ParsedPacket[] {
  const packets: ParsedPacket[] = [];
  let off = 0;
  let little = true;
  const interfaces: { linkType: number; tsResolution: number }[] = [];

  while (off + 12 <= view.byteLength && packets.length < maxPackets) {
    const blockType = view.getUint32(off, little);
    if (blockType === PCAPNG_MAGIC) {
      little = view.getUint32(off + 8, true) === 0x1a2b3c4d;
    }
    const blockLen = view.getUint32(off + 4, little);
    if (blockLen < 12 || off + blockLen > view.byteLength) break;

    if (blockType === 0x00000001) {
      interfaces.push({ linkType: view.getUint16(off + 8, little), tsResolution: 1e6 });
    } else if (blockType === 0x00000006) {
      const ifaceId = view.getUint32(off + 8, little);
      const tsHigh = view.getUint32(off + 12, little);
      const tsLow = view.getUint32(off + 16, little);
      const capLen = view.getUint32(off + 20, little);
      const iface = interfaces[ifaceId] ?? { linkType: 1, tsResolution: 1e6 };
      const tsMs = ((tsHigh * 2 ** 32 + tsLow) / iface.tsResolution) * 1000;
      const pkt = decodeFrame(view, off + 28, capLen, iface.linkType, tsMs);
      if (pkt) packets.push(pkt);
    }
    off += blockLen;
  }

  if (packets.length === 0) throw new PipelineError("PARSING", "No IPv4/IPv6 packets could be decoded from this pcapng capture.");
  return packets;
}
