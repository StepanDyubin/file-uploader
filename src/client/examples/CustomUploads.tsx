import { useMemo, type ReactElement } from 'react';

import { uploadChunk, uploadSingle } from '../api/filesApi';
import { FileUpload, useFileUploader } from '../components/FileUpload';
import { MB } from '../constants';
import { useServerFiles } from '../hooks/useServerFiles';

const linkClass = 'text-sm text-blue-700 underline hover:text-blue-900';

export const CustomUploads = (): ReactElement => {
    const { files: serverFiles, upsertFile } = useServerFiles();
    const {
        files: uploads,
        upload,
        retry,
        remove,
    } = useFileUploader({
        uploadFn: uploadSingle,
        uploadChunkFn: uploadChunk,
        chunkBy: 2 * MB,
        concurrency: 2,
        onFileUploaded: upsertFile,
    });

    const finished = useMemo(() => uploads.filter((file) => file.status === 'uploaded'), [uploads]);
    const clearFinished = () => {
        for (const file of finished) {
            remove(file.id);
        }
    };

    return (
        <FileUpload.Root>
            <FileUpload.Dropzone onFiles={upload}>Drop files here. They upload one at a time.</FileUpload.Dropzone>

            <h2 className="mt-6 text-lg font-semibold text-gray-900">Files on the server</h2>
            <ul
                aria-label="Files on the server"
                className="min-h-0 divide-y divide-gray-300 overflow-y-auto text-gray-900"
            >
                {serverFiles.map((file) => (
                    <li key={file.name} className="truncate py-2">
                        {file.name}
                    </li>
                ))}
            </ul>

            {uploads.length > 0 && (
                <div className="fixed bottom-4 right-4 z-10 flex max-h-[70vh] w-80 flex-col rounded-lg border border-gray-300 bg-white px-4 pb-3 text-sm shadow-xl">
                    <FileUpload.List title="Uploads">
                        {uploads.map((file) => (
                            <FileUpload.Item key={file.id} file={file} onRetry={retry} onRemove={remove} />
                        ))}
                    </FileUpload.List>

                    <div className="mt-2 flex items-baseline justify-between gap-3 text-gray-700">
                        <p>{uploads.length - finished.length} not uploaded yet</p>
                        {finished.length > 0 && (
                            <button type="button" className={linkClass} onClick={clearFinished}>
                                Clear finished
                            </button>
                        )}
                    </div>
                </div>
            )}
        </FileUpload.Root>
    );
};
