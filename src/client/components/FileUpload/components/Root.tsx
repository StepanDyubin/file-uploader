import { type ReactElement, type ReactNode } from 'react';

export type FileUploadRootProps = {
    className?: string;
    children: ReactNode;
};

export const Root = ({ className = '', children }: FileUploadRootProps): ReactElement => (
    <div className={`${className} flex min-h-0 flex-col rounded-xl bg-white p-6 text-left shadow-lg`}>{children}</div>
);

Root.displayName = 'FileUpload.Root';
