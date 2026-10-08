import { type ReactElement, type ReactNode } from 'react';

import { useDropzone } from '../useDropzone';

export type FileUploadTriggerProps = {
    onFiles: (files: File[]) => void;
    children: ReactNode;
};

export const Trigger = ({ onFiles, children }: FileUploadTriggerProps): ReactElement => {
    const { inputProps } = useDropzone({ onFiles });

    return (
        <label className="inline-block cursor-pointer self-start rounded bg-gray-900 px-4 py-2 text-white focus-within:ring-2 focus-within:ring-blue-700 focus-within:ring-offset-2 hover:bg-gray-700">
            <input {...inputProps} className="sr-only" />
            {children}
        </label>
    );
};

Trigger.displayName = 'FileUpload.Trigger';
