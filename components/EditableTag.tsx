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
    color?: 'gold' | 'seal';
    openId?: string | null;
    setOpenId?: (id: string | null) => void;
}

export default function EditableTag({
    id,
    label,
    value,
    options,
    onChange,
    color = 'gold',
    openId,
    setOpenId,
}: EditableTagProps) {
    const [isOpenLocal, setIsOpenLocal] = useState(false);
    const isControlled = Boolean(id && setOpenId);
    const isOpen = isControlled ? openId === id : isOpenLocal;
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    const colorClasses =
        color === 'seal' ? 'tag-editable tag-editable-seal' : 'tag-editable';

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
                type="button"
                className={`${colorClasses} cursor-pointer transition-all flex items-center gap-1 hover:shadow-md`}
            >
                {label && `${label}: `}
                {value}
                <ChevronDown className={`w-3 h-3 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen &&
                createPortal(
                    <>
                        <div className="fixed inset-0 z-[999]" onClick={close} aria-hidden />

                        <div
                            className="fixed rounded-lg shadow-[var(--shadow)] border border-[var(--line)] py-1 z-[1000] max-h-[300px] overflow-y-auto bg-[var(--surface-raised)]"
                            style={{
                                top: dropdownPos.top,
                                left: dropdownPos.left,
                                minWidth: dropdownPos.width,
                                width: 'auto',
                                maxWidth: 260,
                            }}
                        >
                            {options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option);
                                        close();
                                    }}
                                    className={`w-full px-3 py-2 text-left text-sm whitespace-normal transition-colors hover:bg-[var(--surface-sunken)] ${
                                        option === value
                                            ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                                            : 'text-[var(--ink)]'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </>,
                    document.body
                )}
        </div>
    );
}
