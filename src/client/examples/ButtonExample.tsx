import { useMemo, type ReactElement } from 'react';

import { uploadChunk, uploadSingle } from '../api/filesApi';
import { FileUpload, useFileUploader } from '../components/FileUpload';
import { MB } from '../constants';
import { useServerFiles } from '../hooks/useServerFiles';

export const ButtonExample = (): ReactElement => {
    const { files: serverFiles, isLoading, error, upsertFile } = useServerFiles();
    const {
        files: uploads,
        upload,
        retry,
        remove,
    } = useFileUploader({
        uploadFn: uploadSingle,
        uploadChunkFn: uploadChunk,
        chunkBy: 5 * MB,
        onFileUploaded: upsertFile,
    });

    const pending = useMemo(() => uploads.filter((file) => file.status !== 'uploaded'), [uploads]);

    return (
        <FileUpload.Root>
            <FileUpload.Trigger onFiles={upload}>Choose files</FileUpload.Trigger>
            <FileUpload.List isLoading={isLoading} error={error}>
                {/* Show pending first */}
                {pending.map((file) => (
                    <FileUpload.Item key={file.id} file={file} onRetry={retry} onRemove={remove} />
                ))}
                {serverFiles.map((file) => (
                    <FileUpload.Item key={file.name} file={file} />
                ))}
            </FileUpload.List>
        </FileUpload.Root>
    );
};
