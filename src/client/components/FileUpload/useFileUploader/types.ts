export type FileItem = {
    id: string;
    name: string;
    size: number;
    status: 'queued' | 'uploading' | 'uploaded' | 'error';
    progress: number; // 0 to 1
    error?: string;
};

export type UploadFn = (file: File, signal: AbortSignal) => Promise<void>;

export type UploadChunkFn = (
    chunk: Blob,
    fileName: string,
    index: number,
    total: number,
    signal: AbortSignal
) => Promise<void>;

export type FileMeta = {
    file: File;
    abort?: AbortController;
};
