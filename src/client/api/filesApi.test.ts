import { afterEach, describe, expect, it, vi } from 'vitest';

import { getErrorMessage, listFiles, uploadChunk, uploadSingle } from './filesApi';

describe('getErrorMessage', () => {
    it('should read the `error` key of upload responses', () => {
        expect(getErrorMessage('{"error":"Error saving file"}', 500)).toBe('Error saving file');
    });

    it('should read the `message` key of list responses', () => {
        expect(getErrorMessage('{"message":"An error occurred"}', 500)).toBe('An error occurred');
    });

    it('should fall back to the status when the body is not JSON', () => {
        expect(getErrorMessage('<html>Internal Server Error</html>', 500)).toBe('Request failed (500)');
    });

    it('should fall back to the status when the body has no message', () => {
        expect(getErrorMessage('{}', 400)).toBe('Request failed (400)');
    });
});

describe('listFiles', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should return the files from the API', async () => {
        const files = [{ name: 'logo.svg', size: 2048 }];
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ files }) });
        vi.stubGlobal('fetch', fetchMock);

        await expect(listFiles()).resolves.toEqual(files);
        expect(fetchMock).toHaveBeenCalledWith('/api/files', { signal: undefined });
    });

    it('should throw the message from the API when the request fails', async () => {
        const response = { ok: false, status: 500, text: () => Promise.resolve('{"message":"An error occurred"}') };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        await expect(listFiles()).rejects.toThrow('An error occurred');
    });
});

describe('uploads', () => {
    const { signal } = new AbortController();
    const stubFetch = (response: object) => {
        const fetchMock = vi.fn().mockResolvedValue(response);
        vi.stubGlobal('fetch', fetchMock);
        return fetchMock;
    };
    const sentForm = (fetchMock: ReturnType<typeof stubFetch>): FormData =>
        (fetchMock.mock.calls[0] as [string, { body: FormData }])[1].body;

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should post a whole file to the single upload endpoint', async () => {
        const fetchMock = stubFetch({ ok: true, status: 200 });
        const file = new File(['hello'], 'photo.png');

        await uploadSingle(file, signal);

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/upload-single',
            expect.objectContaining({ method: 'POST', signal })
        );
        expect((sentForm(fetchMock).get('file') as File).name).toBe('photo.png');
    });

    it('should post a chunk with its index, the total and the name of the file', async () => {
        const fetchMock = stubFetch({ ok: true, status: 200 });
        // happy-dom drops the file name of a Blob in FormData, so the name is checked on the call that sets it.
        const append = vi.spyOn(FormData.prototype, 'append');
        const chunk = new Blob(['he']);

        await uploadChunk(chunk, 'photo.png', 1, 3, signal);

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/upload-chunk',
            expect.objectContaining({ method: 'POST', signal })
        );
        expect(append).toHaveBeenCalledWith('file', chunk, 'photo.png');
        const form = sentForm(fetchMock);
        expect(form.get('currentChunkIndex')).toBe('1');
        expect(form.get('totalChunks')).toBe('3');

        append.mockRestore();
    });

    it('should throw the error from the API when an upload fails', async () => {
        stubFetch({ ok: false, status: 500, text: () => Promise.resolve('{"error":"Error saving file"}') });

        await expect(uploadSingle(new File(['hello'], 'photo.png'), signal)).rejects.toThrow('Error saving file');
    });
});
