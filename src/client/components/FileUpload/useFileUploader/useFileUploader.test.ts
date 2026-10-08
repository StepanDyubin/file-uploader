import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type UploadChunkFn, type UploadFn } from './types';
import { useFileUploader } from './useFileUploader';

const uploadFn = vi.fn<Parameters<UploadFn>, ReturnType<UploadFn>>();
const uploadChunkFn = vi.fn<Parameters<UploadChunkFn>, ReturnType<UploadChunkFn>>();

const createFile = (name: string, size: number): File => new File(['x'.repeat(size)], name);
const never = (): Promise<void> => new Promise(() => {});

const controlUploads = () => {
    const settle: { finish: () => void; fail: (error: Error) => void }[] = [];
    uploadFn.mockImplementation(() => new Promise((resolve, reject) => settle.push({ finish: resolve, fail: reject })));
    const started = () => uploadFn.mock.calls.map(([file]) => file.name);

    return { settle, started };
};

describe('useFileUploader', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        uploadFn.mockResolvedValue();
        uploadChunkFn.mockResolvedValue();
    });

    describe('adding', () => {
        it('should add files to the list and start uploading them', async () => {
            uploadFn.mockImplementation(never);
            const file = createFile('photo.png', 10);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn }));

            act(() => result.current.upload([file]));

            await waitFor(() =>
                expect(result.current.files).toMatchObject([
                    { name: 'photo.png', size: 10, status: 'uploading', progress: 0 },
                ])
            );
            expect(uploadFn).toHaveBeenCalledWith(file, expect.any(AbortSignal));
        });

        it('should add files to the end of the queue and upload from its front', async () => {
            uploadFn.mockImplementation(never);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, concurrency: 1 }));

            act(() => result.current.upload([createFile('a.txt', 1), createFile('b.txt', 1)]));
            await waitFor(() =>
                expect(result.current.files.map((item) => [item.name, item.status])).toEqual([
                    ['a.txt', 'uploading'],
                    ['b.txt', 'queued'],
                ])
            );

            act(() => result.current.upload([createFile('c.txt', 1)]));

            expect(result.current.files.map((item) => [item.name, item.status])).toEqual([
                ['a.txt', 'uploading'],
                ['b.txt', 'queued'],
                ['c.txt', 'queued'],
            ]);
        });
    });

    describe('finishing', () => {
        it('should keep a finished upload in the list as uploaded and report its file', async () => {
            const onFileUploaded = vi.fn();
            const file = createFile('photo.png', 10);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, onFileUploaded }));

            act(() => result.current.upload([file]));

            await waitFor(() => expect(onFileUploaded).toHaveBeenCalledWith(file));
            expect(onFileUploaded).toHaveBeenCalledTimes(1);
            expect(result.current.files).toMatchObject([
                { name: 'photo.png', size: 10, status: 'uploaded', progress: 1 },
            ]);
        });

        it('should keep an uploaded file in its place while the files after it upload', async () => {
            const { settle } = controlUploads();
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, concurrency: 1 }));

            act(() => result.current.upload([createFile('a.txt', 1), createFile('b.txt', 1)]));
            await waitFor(() => expect(uploadFn).toHaveBeenCalledTimes(1));
            act(() => settle[0].finish());

            await waitFor(() =>
                expect(result.current.files.map((item) => [item.name, item.status])).toEqual([
                    ['a.txt', 'uploaded'],
                    ['b.txt', 'uploading'],
                ])
            );
        });
    });

    describe('order', () => {
        it('should not upload more files at once than the concurrency allows', async () => {
            uploadFn.mockImplementation(never);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, concurrency: 2 }));

            act(() => {
                result.current.upload([createFile('a.txt', 1), createFile('b.txt', 1), createFile('c.txt', 1)]);
            });

            // `c.txt` is the newest, at the end, and waits; the two before it upload.
            await waitFor(() =>
                expect(result.current.files.map((item) => item.status)).toEqual(['uploading', 'uploading', 'queued'])
            );
            expect(uploadFn).toHaveBeenCalledTimes(2);
        });

        it('should upload files in the order they were added, also across batches', async () => {
            const { settle, started } = controlUploads();
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, concurrency: 1 }));

            act(() => result.current.upload([createFile('a.txt', 1), createFile('b.txt', 1)]));
            await waitFor(() => expect(started()).toEqual(['a.txt']));
            // `c.txt` is added later, so it goes to the back of the queue.
            act(() => result.current.upload([createFile('c.txt', 1)]));

            act(() => settle[0].finish());
            await waitFor(() => expect(started()).toEqual(['a.txt', 'b.txt']));

            act(() => settle[1].finish());
            await waitFor(() => expect(started()).toEqual(['a.txt', 'b.txt', 'c.txt']));
        });

        it('should upload a retried file from its place in the list, without moving it', async () => {
            const { settle, started } = controlUploads();
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, concurrency: 1 }));

            act(() => {
                result.current.upload([createFile('a.txt', 1), createFile('b.txt', 1), createFile('c.txt', 1)]);
            });
            await waitFor(() => expect(started()).toEqual(['a.txt']));

            act(() => settle[0].fail(new Error('Error saving file')));
            await waitFor(() => expect(started()).toEqual(['a.txt', 'b.txt']));

            const failed = result.current.files.find((item) => item.status === 'error');
            act(() => result.current.retry(failed?.id ?? ''));
            expect(result.current.files.map((item) => item.name)).toEqual(['a.txt', 'b.txt', 'c.txt']);

            // `a.txt` is still the first file that waits, so it goes before `c.txt`.
            act(() => settle[1].finish());
            await waitFor(() => expect(started()).toEqual(['a.txt', 'b.txt', 'a.txt']));

            act(() => settle[2].finish());
            await waitFor(() => expect(started()).toEqual(['a.txt', 'b.txt', 'a.txt', 'c.txt']));
        });
    });

    describe('failing and retrying', () => {
        it('should keep a failed upload with its message and upload it again on retry', async () => {
            uploadFn.mockRejectedValueOnce(new Error('Error saving file'));
            const onFileUploaded = vi.fn();
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, onFileUploaded }));

            act(() => result.current.upload([createFile('photo.png', 10)]));

            await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'error' }));
            expect(result.current.files[0].error).toBe('Error saving file');
            expect(onFileUploaded).not.toHaveBeenCalled();

            act(() => result.current.retry(result.current.files[0].id));

            await waitFor(() => expect(onFileUploaded).toHaveBeenCalledTimes(1));
            expect(uploadFn).toHaveBeenCalledTimes(2);
            expect(result.current.files).toMatchObject([{ status: 'uploaded', error: undefined }]);
        });

        it('should requeue only a failed upload', async () => {
            uploadFn.mockImplementation(never);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn }));

            act(() => result.current.upload([createFile('photo.png', 10)]));
            await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'uploading' }));

            act(() => result.current.retry(result.current.files[0].id));

            expect(result.current.files[0]).toMatchObject({ status: 'uploading' });
            expect(uploadFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('removing', () => {
        it('should cancel and remove a running upload', async () => {
            uploadFn.mockImplementation(never);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn }));

            act(() => result.current.upload([createFile('photo.png', 10)]));
            await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'uploading' }));

            const signal = uploadFn.mock.calls[0][1];
            act(() => result.current.remove(result.current.files[0].id));

            expect(signal.aborted).toBe(true);
            expect(result.current.files).toEqual([]);
        });

        it('should remove a waiting upload without ever starting it', async () => {
            uploadFn.mockImplementation(never);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, concurrency: 1 }));

            act(() => result.current.upload([createFile('a.txt', 1), createFile('b.txt', 1)]));
            await waitFor(() => expect(uploadFn).toHaveBeenCalledTimes(1));
            const waiting = result.current.files.find((item) => item.status === 'queued');
            expect(waiting?.name).toBe('b.txt');

            act(() => result.current.remove(waiting?.id ?? ''));

            expect(result.current.files.map((item) => item.name)).toEqual(['a.txt']);
            expect(uploadFn).toHaveBeenCalledTimes(1);
        });

        it('should remove an uploaded file from the list', async () => {
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn }));

            act(() => result.current.upload([createFile('photo.png', 10)]));
            await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'uploaded' }));

            act(() => result.current.remove(result.current.files[0].id));

            expect(result.current.files).toEqual([]);
        });

        it('should cancel running uploads when the component goes away', async () => {
            uploadFn.mockImplementation(never);
            const { result, unmount } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn }));

            act(() => result.current.upload([createFile('photo.png', 10)]));
            await waitFor(() => expect(uploadFn).toHaveBeenCalledTimes(1));
            const signal = uploadFn.mock.calls[0][1];
            expect(signal.aborted).toBe(false);

            unmount();

            expect(signal.aborted).toBe(true);
        });
    });

    describe('chunkBy', () => {
        it('should upload a file larger than chunkBy in ordered chunks of that size', async () => {
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, chunkBy: 4 }));

            act(() => result.current.upload([createFile('video.mp4', 10)]));

            await waitFor(() => expect(uploadChunkFn).toHaveBeenCalledTimes(3));
            const calls = uploadChunkFn.mock.calls;
            expect(calls.map(([chunk, name, index, total]) => [chunk.size, name, index, total])).toEqual([
                [4, 'video.mp4', 0, 3],
                [4, 'video.mp4', 1, 3],
                [2, 'video.mp4', 2, 3],
            ]);
            expect(uploadFn).not.toHaveBeenCalled();
        });

        it('should report the share of the file that has been sent after each chunk', async () => {
            // The first two chunks of 4 + 4 + 2 bytes go through, the last one stays in flight.
            uploadChunkFn.mockResolvedValueOnce().mockResolvedValueOnce().mockImplementation(never);
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, chunkBy: 4 }));

            act(() => result.current.upload([createFile('video.mp4', 10)]));

            await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'uploading', progress: 0.8 }));
        });

        it('should stop sending chunks after one fails', async () => {
            uploadChunkFn.mockRejectedValueOnce(new Error('Error saving chunk'));
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, chunkBy: 4 }));

            act(() => result.current.upload([createFile('video.mp4', 10)]));

            await waitFor(() => expect(result.current.files[0]).toMatchObject({ status: 'error' }));
            expect(result.current.files[0].error).toBe('Error saving chunk');
            expect(uploadChunkFn).toHaveBeenCalledTimes(1);
        });

        it('should upload a file of exactly chunkBy bytes and an empty file whole', async () => {
            const { result } = renderHook(() => useFileUploader({ uploadFn, uploadChunkFn, chunkBy: 4 }));

            act(() => result.current.upload([createFile('exact.txt', 4), createFile('empty.txt', 0)]));

            await waitFor(() => expect(uploadFn).toHaveBeenCalledTimes(2));
            expect(uploadChunkFn).not.toHaveBeenCalled();
        });
    });
});
