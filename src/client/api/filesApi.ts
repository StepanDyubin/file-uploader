export type RemoteFile = { name: string; size: number };

export const getErrorMessage = (body: string, status: number): string => {
    const fallback = `Request failed (${status})`;

    try {
        const data = JSON.parse(body) as { error?: string; message?: string };
        return data.error ?? data.message ?? fallback;
    } catch {
        return fallback;
    }
};

const throwIfFailed = async (response: Response): Promise<void> => {
    if (!response.ok) {
        throw new Error(getErrorMessage(await response.text(), response.status));
    }
};

export const listFiles = async (signal?: AbortSignal): Promise<RemoteFile[]> => {
    const response = await fetch('/api/files', { signal });
    await throwIfFailed(response);

    const data = (await response.json()) as { files: RemoteFile[] };
    return data.files;
};

export const uploadSingle = async (file: File, signal: AbortSignal): Promise<void> => {
    const body = new FormData();
    body.append('file', file, file.name);

    const response = await fetch('/api/upload-single', { method: 'POST', body, signal });
    await throwIfFailed(response);
};

export const uploadChunk = async (
    chunk: Blob,
    fileName: string,
    index: number,
    total: number,
    signal: AbortSignal
): Promise<void> => {
    const body = new FormData();

    body.append('file', chunk, fileName);
    body.append('currentChunkIndex', String(index));
    body.append('totalChunks', String(total));

    const response = await fetch('/api/upload-chunk', { method: 'POST', body, signal });
    await throwIfFailed(response);
};
