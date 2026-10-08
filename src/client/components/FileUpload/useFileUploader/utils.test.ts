import { describe, expect, it } from 'vitest';

import { type FileItem } from './types';
import { pickQueued } from './utils';

const createItem = (id: string, status: FileItem['status']): FileItem => ({
    id,
    name: id,
    size: 1,
    status,
    progress: 0,
});

describe('pickQueued', () => {
    it('should pick queued files from the front of the queue', () => {
        const queue = [createItem('a', 'queued'), createItem('b', 'queued'), createItem('c', 'queued')];

        expect(pickQueued(queue, 2)).toEqual(['a', 'b']);
    });

    it('should only fill the slots that running uploads leave free', () => {
        const queue = [createItem('a', 'uploading'), createItem('b', 'queued'), createItem('c', 'queued')];

        expect(pickQueued(queue, 2)).toEqual(['b']);
    });

    it('should pick nothing when every slot is taken', () => {
        const queue = [createItem('a', 'uploading'), createItem('b', 'uploading'), createItem('c', 'queued')];

        expect(pickQueued(queue, 2)).toEqual([]);
    });

    it('should skip files that are not queued', () => {
        const queue = [createItem('a', 'error'), createItem('b', 'uploaded'), createItem('c', 'queued')];

        expect(pickQueued(queue, 3)).toEqual(['c']);
    });
});
