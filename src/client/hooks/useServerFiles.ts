import { useCallback, useEffect, useRef, useState } from 'react';

import { type RemoteFile, listFiles } from '../api/filesApi';

export const useServerFiles = () => {
    const [files, setFiles] = useState<RemoteFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();
    const request = useRef<AbortController>();

    const refetch = useCallback(() => {
        request.current?.abort();
        const current = new AbortController();
        request.current = current;

        setIsLoading(true);
        setError(undefined);

        listFiles(current.signal)
            .then((loaded) => {
                if (current.signal.aborted) {
                    return;
                }
                request.current = undefined;
                setFiles(loaded);
                setIsLoading(false);
            })
            .catch((error: Error) => {
                if (current.signal.aborted) {
                    return;
                }
                request.current = undefined;
                setError(error.message);
                setIsLoading(false);
            });
    }, []);

    useEffect(() => {
        refetch();

        return () => {
            request.current?.abort();
        };
    }, [refetch]);

    const upsertFile = useCallback(
        ({ name, size }: RemoteFile) => {
            setFiles((current) => {
                const others = current.filter((item) => item.name !== name);

                const index = others.findIndex((item) => item.name > name);
                const position = index === -1 ? others.length : index;

                return [...others.slice(0, position), { name, size }, ...others.slice(position)];
            });

            if (request.current) {
                refetch();
            }
        },
        [refetch]
    );

    return { files, isLoading, error, refetch, upsertFile };
};
