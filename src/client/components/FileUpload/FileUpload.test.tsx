import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FileUpload } from './FileUpload';
import { type UploadChunkFn, type UploadFn, type UseFileUploaderOptions, useFileUploader } from './useFileUploader';

const uploadFn = vi.fn<Parameters<UploadFn>, ReturnType<UploadFn>>();
const uploadChunkFn = vi.fn<Parameters<UploadChunkFn>, ReturnType<UploadChunkFn>>();

const photo = new File(['hello'], 'photo.png');
const never = (): Promise<void> => new Promise(() => {});

type UploadProps = Partial<UseFileUploaderOptions> & {
    isLoading?: boolean;
    error?: string;
};

const Upload = ({ isLoading = false, error, ...options }: UploadProps): ReactElement => {
    const { files, upload, retry, remove } = useFileUploader({ uploadFn, uploadChunkFn, ...options });

    return (
        <FileUpload.Root>
            <FileUpload.Dropzone onFiles={upload} />
            <FileUpload.List isLoading={isLoading} error={error}>
                {files.map((file) => (
                    <FileUpload.Item key={file.id} file={file} onRetry={retry} onRemove={remove} />
                ))}
            </FileUpload.List>
        </FileUpload.Root>
    );
};

describe('FileUpload', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        uploadFn.mockResolvedValue();
        uploadChunkFn.mockResolvedValue();
    });

    describe('the list', () => {
        it('should show a loading state', () => {
            render(<Upload isLoading />);

            expect(screen.getByText('Loading files…')).toBeInTheDocument();
            expect(screen.queryByText('No files yet.')).not.toBeInTheDocument();
        });

        it('should show an empty state', () => {
            render(<Upload />);

            expect(screen.getByText('No files yet.')).toBeInTheDocument();
        });

        it('should show the error of a list that could not be loaded', () => {
            render(<Upload error="An error occurred" />);

            expect(screen.getByRole('alert')).toHaveTextContent('Could not load files: An error occurred');
            expect(screen.queryByText('No files yet.')).not.toBeInTheDocument();
        });

        it('should show a file that has only a name and a size as uploaded', () => {
            render(
                <FileUpload.List>
                    <FileUpload.Item file={{ name: 'logo.svg', size: 2048 }} />
                </FileUpload.List>
            );

            expect(screen.getByText('logo.svg')).toBeInTheDocument();
            expect(screen.getByText('2.0 KB')).toBeInTheDocument();
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });
    });

    describe('uploading', () => {
        it('should upload a file picked through the input and keep it in the list', async () => {
            const onFileUploaded = vi.fn();
            const user = userEvent.setup();
            render(<Upload onFileUploaded={onFileUploaded} />);

            await user.upload(screen.getByLabelText(/drop files here/i), photo);

            await waitFor(() => expect(onFileUploaded).toHaveBeenCalledWith(photo));

            // The finished upload stays in the list without progress or buttons.
            await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
            expect(screen.getByText('photo.png')).toBeInTheDocument();
            expect(screen.getByText('5 B')).toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('should upload a dropped file', async () => {
            render(<Upload />);

            fireEvent.drop(screen.getByText(/drop files here/i), { dataTransfer: { files: [photo] } });

            await waitFor(() => expect(uploadFn).toHaveBeenCalledWith(photo, expect.any(AbortSignal)));
        });

        it('should show how much of a chunked file has been sent', async () => {
            // `photo` has 5 bytes: with 2-byte chunks the first of three goes through and the second stays in flight.
            uploadChunkFn.mockResolvedValueOnce().mockImplementation(never);
            const user = userEvent.setup();
            render(<Upload chunkBy={2} />);

            await user.upload(screen.getByLabelText(/drop files here/i), photo);

            const progress = await screen.findByRole('progressbar', { name: 'Upload progress of photo.png' });
            await waitFor(() => expect(progress).toHaveAttribute('value', '0.4'));
            expect(screen.getByText('40%')).toBeInTheDocument();
        });

        it('should show an indeterminate progress for a file sent whole', async () => {
            uploadFn.mockImplementation(never);
            const user = userEvent.setup();
            render(<Upload />);

            await user.upload(screen.getByLabelText(/drop files here/i), photo);

            const progress = await screen.findByRole('progressbar', { name: 'Upload progress of photo.png' });
            expect(progress).not.toHaveAttribute('value');
            expect(screen.getByText('Uploading')).toBeInTheDocument();
        });

        it('should cancel a running upload', async () => {
            uploadFn.mockImplementation(never);
            const user = userEvent.setup();
            render(<Upload />);

            await user.upload(screen.getByLabelText(/drop files here/i), photo);
            await user.click(await screen.findByRole('button', { name: 'Cancel upload of photo.png' }));

            expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
            expect(uploadFn.mock.calls[0][1].aborted).toBe(true);
        });

        it('should show a failed upload with the error from the API and upload it again on retry', async () => {
            uploadFn.mockRejectedValueOnce(new Error('Error saving file'));
            uploadFn.mockImplementation(never);
            const user = userEvent.setup();
            render(<Upload />);

            await user.upload(screen.getByLabelText(/drop files here/i), photo);

            expect(await screen.findByText(/Error saving file/)).toBeInTheDocument();

            await user.click(screen.getByRole('button', { name: 'Retry upload of photo.png' }));

            await waitFor(() => expect(uploadFn).toHaveBeenCalledTimes(2));
            expect(screen.queryByText(/Error saving file/)).not.toBeInTheDocument();
        });

        it('should dismiss a failed upload', async () => {
            uploadFn.mockRejectedValueOnce(new Error('Error saving file'));
            const user = userEvent.setup();
            render(<Upload />);

            await user.upload(screen.getByLabelText(/drop files here/i), photo);
            await user.click(await screen.findByRole('button', { name: 'Dismiss photo.png' }));

            expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
        });
    });
});
