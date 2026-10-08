import { type ReactElement } from 'react';

import { ButtonExample } from './examples/ButtonExample';
import { CustomUploads } from './examples/CustomUploads';
import { DropzoneExample } from './examples/DropzoneExample';
import { type TabItem, Tabs } from './examples/Tabs';

const examples: TabItem[] = [
    { label: 'Dropzone', content: <DropzoneExample /> },
    { label: 'Button', content: <ButtonExample /> },
    { label: 'CustomUploads', content: <CustomUploads /> },
];

export const App = (): ReactElement => {
    return (
        <main className="relative isolate h-dvh">
            <img
                src="https://cdn-assets-eu.frontify.com/s3/frontify-enterprise-files-eu/eyJwYXRoIjoid2VhcmVcL2FjY291bnRzXC82ZVwvNDAwMDM4OFwvcHJvamVjdHNcLzk4NFwvYXNzZXRzXC9iOFwvMTE1MjY1XC8xMjYwMTU0YzFhYmVmMDVjNjZlY2Q2MDdmMTRhZTkxNS0xNjM4MjU4MjQwLmpwZyJ9:weare:_kpZgwnGPTxOhYxIyfS1MhuZmxGrFCzP6ZW6dc-F6BQ?width=2400"
                alt="background image"
                aria-hidden="true"
                className="absolute inset-0 -z-10 h-full w-full object-cover object-top"
            />

            <div className="mx-auto flex h-full max-w-7xl flex-col px-6 pb-6 pt-32 text-center sm:pt-40 lg:px-8">
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-800 sm:text-5xl">Hello there</h1>
                <div className="mt-8 flex min-h-0 flex-col">
                    <Tabs label="Upload examples" tabs={examples} />
                </div>
            </div>
        </main>
    );
};
