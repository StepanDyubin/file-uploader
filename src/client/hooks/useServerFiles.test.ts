import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listFiles } from '../api/filesApi';

import { useServerFiles } from './useServerFiles';

vi.mock('../api/filesApi');

const logo = { name: 'logo.svg', size: 2048 };
const photo = { name: 'photo.png', size: 5 };

describe('useServerFiles', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(listFiles).mockResolvedValue([]);
    });

    it('should be loading at first and then return the list', async () => {
        vi.mocked(listFiles).mockResolvedValue([logo]);

        const { result } = renderHook(() => useServerFiles());
        expect(result.current).toMatchObject({ files: [], isLoading: true });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.files).toEqual([logo]);
        expect(result.current.error).toBeUndefined();
        expect(listFiles).toHaveBeenCalledTimes(1);
    });

    describe('upsertFile', () => {
        it('should put an uploaded file at its place by name, in place of the file with the same name', async () => {
            vi.mocked(listFiles).mockResolvedValue([logo, photo]);
            const { result } = renderHook(() => useServerFiles());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            act(() => result.current.upsertFile({ name: 'photo.png', size: 10 }));
            act(() => result.current.upsertFile({ name: 'new.txt', size: 1 }));

            expect(result.current.files).toEqual([logo, { name: 'new.txt', size: 1 }, { name: 'photo.png', size: 10 }]);
        });

        it('should put a file at the start, in the middle or at the end of the list, by its name as the server does', async () => {
            vi.mocked(listFiles).mockResolvedValue([logo, photo]);
            const { result } = renderHook(() => useServerFiles());
            await waitFor(() => expect(result.current.isLoading).toBe(false));

            act(() => result.current.upsertFile({ name: 'avatar.png', size: 1 }));
            act(() => result.current.upsertFile({ name: 'notes.txt', size: 1 }));
            act(() => result.current.upsertFile({ name: 'zoo.txt', size: 1 }));

            expect(result.current.files.map((file) => file.name)).toEqual([
                'avatar.png',
                'logo.svg',
                'notes.txt',
                'photo.png',
                'zoo.txt',
            ]);
        });
    });

    it('should cancel a running request when the component goes away', () => {
        vi.mocked(listFiles).mockReturnValue(new Promise(() => {}));
        const { unmount } = renderHook(() => useServerFiles());
        const signal = vi.mocked(listFiles).mock.calls[0][0];
        expect(signal?.aborted).toBe(false);

        unmount();

        expect(signal?.aborted).toBe(true);
    });
});
