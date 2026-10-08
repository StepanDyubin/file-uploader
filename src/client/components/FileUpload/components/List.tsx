import { Children, type ReactElement, type ReactNode, useId } from 'react';

export type FileUploadListProps = {
    title?: string;
    isLoading?: boolean;
    error?: string;
    children?: ReactNode;
};

export const List = ({ title = 'Files', isLoading = false, error, children }: FileUploadListProps): ReactElement => {
    const headingId = useId();
    const isEmpty = Children.toArray(children).length === 0;

    return (
        <section aria-labelledby={headingId} className="mt-6 flex min-h-0 flex-col text-left">
            <h2 id={headingId} className="text-lg font-semibold text-gray-900">
                {title}
            </h2>

            {isLoading && <p className="py-2 text-gray-700">Loading files…</p>}

            {error !== undefined && (
                <p role="alert" className="py-2 text-red-700">
                    Could not load files: {error}
                </p>
            )}

            {!isLoading && error === undefined && isEmpty && <p className="py-2 text-gray-700">No files yet.</p>}

            {!isEmpty && <ul className="-mx-1 min-h-0 divide-y divide-gray-300 overflow-y-auto px-1">{children}</ul>}
        </section>
    );
};

List.displayName = 'FileUpload.List';
