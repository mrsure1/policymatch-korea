'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface EditableTagProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    color?: 'blue' | 'slate';
}

export default function EditableTag({ label, value, options, onChange, color = 'slate' }: EditableTagProps) {
    const [isOpen, setIsOpen] = useState(false);

    const colorClasses = color === 'blue'
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`px-3 py-1 ${colorClasses} rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-1 hover:shadow-md`}
            >
                {label && `${label}: `}{value}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border-2 border-slate-200 py-2 z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${option === value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-700'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
