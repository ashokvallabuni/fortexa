import { describe, expect, it } from 'vitest';
import { detectFormat, validateUpload } from './validation';

describe('upload validation', () => {
  it('detects supported tabular and JSON sources', () => {
    expect(detectFormat(new TextEncoder().encode('src_ip,dst_ip,protocol'))).toBe('csv');
    expect(detectFormat(new TextEncoder().encode('{"src_ip":"192.0.2.1"}'))).toBe('netflow');
  });

  it('rejects a PCAP extension without a capture signature', () => {
    expect(() => validateUpload('capture.pcap', 4, new Uint8Array([1, 2, 3, 4]))).toThrow(
      'valid libpcap or pcapng signature',
    );
  });

  it('returns the normalized source format for valid CSV input', () => {
    expect(validateUpload('flows.csv', 32, new TextEncoder().encode('src_ip,dst_ip'))).toMatchObject({
      format: 'csv',
      extension: 'csv',
      sizeBytes: 32,
    });
  });
});
