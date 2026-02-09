'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface EditableTagProps {
    id?: string;
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    color?: 'blue' | 'slate';
    openId?: string | null;
    setOpenId?: (id: string | null) => void;
}

export default function EditableTag({
    id,
    label,
    value,
    options,
    onChange,
    color = 'slate',
    openId,
    setOpenId,
}: EditableTagProps) {
    const [isOpenLocal, setIsOpenLocal] = useState(false);
    const isControlled = Boolean(id && setOpenId);
    const isOpen = isControlled ? openId === id : isOpenLocal;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    const colorClasses = color === 'blue'
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

    const close = () => {
        if (isControlled) {
            setOpenId?.(null);
        } else {
            setIsOpenLocal(false);
        }
    };

    const toggle = () => {
        if (isControlled) {
            setOpenId?.(isOpen ? null : id!);
        } else {
            setIsOpenLocal(!isOpen);
        }
    };

    const updatePosition = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        setDropdownPos({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
        });
    };

    useLayoutEffect(() => {
        if (isOpen) updatePosition();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handler = () => updatePosition();
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        return () => {
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
    }, [isOpen]);

    return (
        <div className="relative inline-block">
            <button
                ref={buttonRef}
                onClick={toggle}
                className={`px-3 py-1 ${colorClasses} rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-1 hover:shadow-md`}
            >
                {label && `${label}: `}{value}
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                createPortal(
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-[999]"
                            onClick={close}
                        />

                        {/* Dropdown */}
                        <div
                            className="fixed bg-white rounded-lg shadow-xl border-2 border-slate-200 py-2 z-[1000] max-h-[300px] overflow-y-auto"
                            style={{ top: dropdownPos.top, left: dropdownPos.left, minWidth: dropdownPos.width, width: 'auto', maxWidth: 260 }}
                        >
                            {options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        onChange(option);
                                        close();
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm whitespace-normal hover:bg-blue-50 transition-colors ${option === value ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-700'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </>,
                    document.body
                )
            )}
        </div>
    );
}
