import { type ReactElement, type ReactNode } from 'react';

import { useDropzone } from '../useDropzone';

export type FileUploadDropzoneProps = {
    onFiles: (files: File[]) => void;
    children?: ReactNode;
};

export const Dropzone = ({
    onFiles,
    children = 'Drop files here, or click to browse',
}: FileUploadDropzoneProps): ReactElement => {
    const { isDragging, rootProps, inputProps } = useDropzone({ onFiles });

    return (
        <label
            {...rootProps}
            className={`block cursor-pointer rounded-lg border-2 p-8 text-center text-gray-900 focus-within:ring-2 focus-within:ring-blue-700 focus-within:ring-offset-2 ${
                isDragging ? 'border-solid border-blue-700 bg-blue-50' : 'border-dashed border-gray-500 bg-white'
            }`}
        >
            <input {...inputProps} className="sr-only" />
            <span>{children}</span>
        </label>
    );
};

Dropzone.displayName = 'FileUpload.Dropzone';
