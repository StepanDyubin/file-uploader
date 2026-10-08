import { type ReactElement, type ReactNode, useId, useState } from 'react';

export type TabItem = {
    label: string;
    content: ReactNode;
};

export type TabsProps = {
    label: string;
    tabs: TabItem[];
};

export const Tabs = ({ label, tabs }: TabsProps): ReactElement => {
    const [selected, setSelected] = useState(0);
    const id = useId();

    return (
        <div className="flex min-h-0 flex-col">
            <div
                role="tablist"
                aria-label={label}
                className="inline-flex gap-1 self-center rounded-lg bg-white p-1 shadow-lg"
            >
                {tabs.map((tab, index) => (
                    <button
                        key={tab.label}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${index}`}
                        aria-selected={index === selected}
                        aria-controls={`${id}-panel-${index}`}
                        tabIndex={index === selected ? 0 : -1}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                            index === selected ? 'bg-gray-900 text-white' : 'text-gray-900 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelected(index)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {tabs.map((tab, index) => (
                <div
                    key={tab.label}
                    role="tabpanel"
                    id={`${id}-panel-${index}`}
                    aria-labelledby={`${id}-tab-${index}`}
                    hidden={index !== selected}
                    className={index === selected ? 'mt-4 flex min-h-0 flex-col' : undefined}
                >
                    {tab.content}
                </div>
            ))}
        </div>
    );
};
