import { useCallback, useEffect, useRef, useState } from 'react';

import { MB } from '../../../constants';

import { type FileItem, type FileMeta, type UploadChunkFn, type UploadFn } from './types';
import { pickQueued, uploadFile } from './utils';

export type UseFileUploaderOptions = {
    /** Sends a whole file. */
    uploadFn: UploadFn;
    /** Sends one chunk of a file */
    uploadChunkFn: UploadChunkFn;
    /**
     * Chunk size in bytes. Files larger than this are uploaded in chunks
     *
     * @default 4 * MB
     */
    chunkBy?: number;
    /**
     * How many files upload at the same time.
     *
     * @default 3
     */
    concurrency?: number;
    /** Called once for each file that finishes. */
    onFileUploaded?: (file: File) => void;
};

export type UseFileUploaderResult = {
    files: FileItem[];
    upload: (files: File[]) => void;
    retry: (id: string) => void;
    remove: (id: string) => void;
};

export const useFileUploader = ({
    uploadFn,
    uploadChunkFn,
    chunkBy = 4 * MB,
    concurrency = 3,
    onFileUploaded,
}: UseFileUploaderOptions): UseFileUploaderResult => {
    const [files, setFiles] = useState<FileItem[]>([]);
    const fileMeta = useRef(new Map<string, FileMeta>());

    const options = useRef({ uploadFn, uploadChunkFn, chunkBy, onFileUploaded });
    options.current = { uploadFn, uploadChunkFn, chunkBy, onFileUploaded };

    const updateFile = useCallback((id: string, changes: Partial<FileItem>) => {
        setFiles((items) => items.map((item) => (item.id === id ? { ...item, ...changes } : item)));
    }, []);

    const upload = useCallback((added: File[]) => {
        const items = added.map((file): FileItem => {
            const id = crypto.randomUUID();
            fileMeta.current.set(id, { file });

            return { id, name: file.name, size: file.size, status: 'queued', progress: 0 };
        });
        setFiles((current) => [...current, ...items]);
    }, []);

    const retry = useCallback((id: string) => {
        setFiles((items) =>
            items.map(
                (item): FileItem =>
                    item.id === id && item.status === 'error'
                        ? { ...item, status: 'queued', progress: 0, error: undefined }
                        : item
            )
        );
    }, []);

    const remove = useCallback((id: string) => {
        fileMeta.current.get(id)?.abort?.abort();
        fileMeta.current.delete(id);
        setFiles((items) => items.filter((item) => item.id !== id));
    }, []);

    const startUpload = useCallback(
        (id: string) => {
            const meta = fileMeta.current.get(id);
            if (!meta) {
                return;
            }

            const { file } = meta;
            const abort = new AbortController();
            meta.abort = abort;
            updateFile(id, { status: 'uploading' });

            uploadFile(file, options.current, abort.signal, (progress) => updateFile(id, { progress }))
                .then(() => {
                    if (abort.signal.aborted) {
                        return;
                    }
                    fileMeta.current.delete(id);
                    updateFile(id, { status: 'uploaded', progress: 1 });
                    options.current.onFileUploaded?.(file);
                })
                .catch((error: Error) => {
                    meta.abort = undefined;
                    updateFile(id, { status: 'error', error: error.message });
                });
        },
        [updateFile]
    );

    // Starts queued uploads while there is a free slot
    useEffect(() => {
        for (const id of pickQueued(files, concurrency)) {
            startUpload(id);
        }
    }, [files, concurrency, startUpload]);

    useEffect(() => {
        const meta = fileMeta.current;

        return () => {
            for (const { abort } of meta.values()) {
                abort?.abort();
            }
        };
    }, []);

    return { files, upload, retry, remove };
};
