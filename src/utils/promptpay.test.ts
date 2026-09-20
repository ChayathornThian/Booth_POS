import { describe, it, expect } from 'vitest';
import { formatPromptPayTarget, generatePromptPayPayload } from './promptpay';

describe('promptpay offline generator', () => {
  it('formats standard 10-digit mobile number with international 0066', () => {
    const res = formatPromptPayTarget('0812345678');
    expect(res.subTag).toBe('01');
    expect(res.value).toBe('0066812345678');
  });

  it('formats formatted mobile number with hyphens', () => {
    const res = formatPromptPayTarget('081-234-5678');
    expect(res.subTag).toBe('01');
    expect(res.value).toBe('0066812345678');
  });

  it('formats 13-digit national ID', () => {
    const res = formatPromptPayTarget('1234567890123');
    expect(res.subTag).toBe('02');
    expect(res.value).toBe('1234567890123');
  });

  it('generates well-formed EMVCo payload with amount', () => {
    const payload = generatePromptPayPayload('0812345678', 150.00);
    expect(payload).toContain('000201'); // Version
    expect(payload).toContain('010212'); // Dynamic QR with amount
    expect(payload).toContain('5303764'); // THB currency
    expect(payload).toContain('5406150.00'); // Amount 150.00
    expect(payload).toContain('5802TH'); // Country Thailand
    expect(payload).toContain('6304'); // CRC checksum tag
    expect(payload.length).toBeGreaterThan(60);
  });
});
