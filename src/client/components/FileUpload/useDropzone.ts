import { type ChangeEvent, type DragEvent, useState } from 'react';

export type UseDropzoneOptions = {
    onFiles: (files: File[]) => void;
};

export const useDropzone = ({ onFiles }: UseDropzoneOptions) => {
    const [isDragging, setIsDragging] = useState(false);

    const emit = (list: ArrayLike<File> | null) => {
        const files = Array.from(list ?? []);
        if (files.length > 0) {
            onFiles(files);
        }
    };

    const rootProps = {
        onDragEnter: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            setIsDragging(true);
        },
        onDragOver: (event: DragEvent<HTMLElement>) => event.preventDefault(),
        onDragLeave: (event: DragEvent<HTMLElement>) => {
            // dragleave also fires when the pointer moves onto a child element, which is not leaving the area.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
            }
        },
        onDrop: (event: DragEvent<HTMLElement>) => {
            event.preventDefault();
            setIsDragging(false);
            emit(event.dataTransfer.files);
        },
    };

    const inputProps = {
        type: 'file' as const,
        multiple: true,
        onChange: (event: ChangeEvent<HTMLInputElement>) => {
            emit(event.target.files);
            // Lets the same file be picked again.
            event.target.value = '';
        },
    };

    return { isDragging, rootProps, inputProps };
};
