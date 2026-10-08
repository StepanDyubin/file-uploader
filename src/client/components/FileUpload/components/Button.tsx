import { type ButtonHTMLAttributes, type ReactElement } from 'react';

export const Button = (props: ButtonHTMLAttributes<HTMLButtonElement>): ReactElement => (
    <button
        type="button"
        className="rounded border border-gray-500 px-2 py-1 text-sm text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        {...props}
    />
);
