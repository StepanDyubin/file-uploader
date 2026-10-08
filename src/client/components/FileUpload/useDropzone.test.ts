import { act, renderHook } from '@testing-library/react';
import { type ChangeEvent, type DragEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDropzone } from './useDropzone';

const createDragEvent = (files: File[] = []) =>
    ({ preventDefault: vi.fn(), dataTransfer: { files } }) as unknown as DragEvent<HTMLElement>;

// `relatedTarget` is the element the pointer moves onto, or null when it leaves the window.
const createLeaveEvent = (currentTarget: HTMLElement, relatedTarget: Node | null) =>
    ({ currentTarget, relatedTarget }) as unknown as DragEvent<HTMLElement>;

const first = new File(['a'], 'a.txt');
const second = new File(['b'], 'b.txt');

describe('useDropzone', () => {
    it('should stay in the dragging state while the pointer moves over child elements', () => {
        const { result } = renderHook(() => useDropzone({ onFiles: vi.fn() }));
        const area = document.createElement('div');
        const child = area.appendChild(document.createElement('span'));
        expect(result.current.isDragging).toBe(false);

        act(() => result.current.rootProps.onDragEnter(createDragEvent()));
        act(() => result.current.rootProps.onDragLeave(createLeaveEvent(area, child)));
        expect(result.current.isDragging).toBe(true);

        act(() => result.current.rootProps.onDragLeave(createLeaveEvent(area, document.body)));
        expect(result.current.isDragging).toBe(false);
    });

    it('should leave the dragging state when the pointer leaves the window', () => {
        const { result } = renderHook(() => useDropzone({ onFiles: vi.fn() }));

        act(() => result.current.rootProps.onDragEnter(createDragEvent()));
        act(() => result.current.rootProps.onDragLeave(createLeaveEvent(document.createElement('div'), null)));

        expect(result.current.isDragging).toBe(false);
    });

    it('should pass dropped files on and leave the dragging state', () => {
        const onFiles = vi.fn();
        const { result } = renderHook(() => useDropzone({ onFiles }));
        const event = createDragEvent([first, second]);

        act(() => result.current.rootProps.onDragEnter(createDragEvent()));
        act(() => result.current.rootProps.onDrop(event));

        expect(event.preventDefault).toHaveBeenCalled();
        expect(onFiles).toHaveBeenCalledWith([first, second]);
        expect(result.current.isDragging).toBe(false);
    });

    it('should pass on files picked through the input and reset it', () => {
        const onFiles = vi.fn();
        const { result } = renderHook(() => useDropzone({ onFiles }));
        const target = { files: [first], value: 'C:\\fakepath\\a.txt' };

        act(() => result.current.inputProps.onChange({ target } as unknown as ChangeEvent<HTMLInputElement>));

        expect(onFiles).toHaveBeenCalledWith([first]);
        expect(target.value).toBe('');
    });

    it('should not call onFiles when nothing was picked', () => {
        const onFiles = vi.fn();
        const { result } = renderHook(() => useDropzone({ onFiles }));

        act(() => result.current.rootProps.onDrop(createDragEvent([])));

        expect(onFiles).not.toHaveBeenCalled();
    });
});
