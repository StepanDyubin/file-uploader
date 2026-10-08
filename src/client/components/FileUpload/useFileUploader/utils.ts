import { type FileItem, type UploadChunkFn, type UploadFn } from './types';

export const pickQueued = (files: FileItem[], concurrency: number): string[] => {
    const active = files.filter((item) => item.status === 'uploading').length;

    return files
        .filter((item) => item.status === 'queued')
        .slice(0, Math.max(0, concurrency - active))
        .map((item) => item.id);
};

export type UploadFileOptions = {
    uploadFn: UploadFn;
    uploadChunkFn: UploadChunkFn;
    chunkBy: number;
};

type OnProgress = (progress: number) => void;

const uploadInChunks = async (
    file: File,
    uploadChunkFn: UploadChunkFn,
    chunkSize: number,
    signal: AbortSignal,
    onProgress: OnProgress
): Promise<void> => {
    const total = Math.ceil(file.size / chunkSize);

    for (let index = 0; index < total; index++) {
        const start = index * chunkSize;
        const chunk = file.slice(start, start + chunkSize);

        await uploadChunkFn(chunk, file.name, index, total, signal);
        onProgress(Number(((start + chunk.size) / file.size).toFixed(2)));
    }
};

export const uploadFile = (
    file: File,
    { uploadFn, uploadChunkFn, chunkBy }: UploadFileOptions,
    signal: AbortSignal,
    onProgress: OnProgress
): Promise<void> =>
    file.size > chunkBy ? uploadInChunks(file, uploadChunkFn, chunkBy, signal, onProgress) : uploadFn(file, signal);
