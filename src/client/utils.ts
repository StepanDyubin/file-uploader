import { KB } from './constants';

export const formatBytes = (bytes: number): string => {
    if (bytes < KB) {
        return `${bytes} B`;
    }

    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / KB;
    let unit = 0;
    while (value >= KB && unit < units.length - 1) {
        value /= KB;
        unit++;
    }

    return `${value.toFixed(1)} ${units[unit]}`;
};
