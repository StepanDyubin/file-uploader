import { describe, expect, it } from 'vitest';

import { KB, MB } from './constants';
import { formatBytes } from './utils';

const GB = KB * MB;
const TB = KB * GB;

describe('formatBytes', () => {
    it('should show sizes below 1 KB in whole bytes', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(5)).toBe('5 B');
        expect(formatBytes(KB - 1)).toBe('1023 B');
    });

    it('should switch to the next unit at each power of 1024', () => {
        expect(formatBytes(KB)).toBe('1.0 KB');
        expect(formatBytes(MB)).toBe('1.0 MB');
        expect(formatBytes(GB)).toBe('1.0 GB');
        expect(formatBytes(TB)).toBe('1.0 TB');
    });

    it('should round to one decimal', () => {
        expect(formatBytes(1.5 * KB)).toBe('1.5 KB');
        expect(formatBytes(2.25 * MB)).toBe('2.3 MB');
        expect(formatBytes(4 * MB + 1)).toBe('4.0 MB');
    });

    it('should stay in TB for sizes beyond it', () => {
        expect(formatBytes(2048 * TB)).toBe('2048.0 TB');
    });
});
