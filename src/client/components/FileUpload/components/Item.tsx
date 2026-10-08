import { type ReactElement, memo } from 'react';

import { formatBytes } from '../../../utils';
import { type FileItem } from '../useFileUploader';

import { Button } from './Button';

export type FileUploadItemProps = {
    file: Pick<FileItem, 'name' | 'size'> & Partial<FileItem>;
    onRetry?: (id: string) => void;
    onRemove?: (id: string) => void;
};

export const Item = memo(({ file, onRetry, onRemove }: FileUploadItemProps): ReactElement => {
    const { name, size, id = name, status = 'uploaded', progress = 1, error } = file;
    const isActive = status === 'queued' || status === 'uploading';

    const isIndeterminate = status === 'uploading' && progress === 0;
    const progressText = isIndeterminate ? 'Uploading' : `${Math.floor(progress * 100)}%`;

    return (
        <li className="relative flex items-center gap-3 py-2 text-left">
            <div className="min-w-0 flex-1">
                <p className="truncate">{name}</p>
                {status === 'error' ? (
                    <p role="alert" className="truncate text-sm text-red-700" title={error}>
                        Upload failed: {error}
                    </p>
                ) : (
                    <p className="flex gap-2 text-sm text-gray-700">
                        <span>{formatBytes(size)}</span>
                        {isActive && <span>{status === 'uploading' ? progressText : 'Queued'}</span>}
                    </p>
                )}
            </div>

            {status === 'error' && (
                <>
                    <Button aria-label={`Retry upload of ${name}`} onClick={() => onRetry?.(id)}>
                        Retry
                    </Button>
                    <Button aria-label={`Dismiss ${name}`} onClick={() => onRemove?.(id)}>
                        Dismiss
                    </Button>
                </>
            )}

            {isActive && (
                <>
                    <Button aria-label={`Cancel upload of ${name}`} onClick={() => onRemove?.(id)}>
                        Cancel
                    </Button>
                    <progress
                        className="absolute inset-x-0 bottom-0 h-1 w-full"
                        aria-label={`Upload progress of ${name}`}
                        value={isIndeterminate ? undefined : progress}
                        max={1}
                    />
                </>
            )}
        </li>
    );
});

Item.displayName = 'FileUpload.Item';
