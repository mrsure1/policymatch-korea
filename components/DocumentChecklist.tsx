'use client';

import { useState } from 'react';
import { PolicyDocument } from '@/lib/mockPolicies';
import { ExternalLink, FileText, CheckCircle2, Circle } from 'lucide-react';

interface DocumentChecklistProps {
    documents: PolicyDocument[];
}

export default function DocumentChecklist({ documents }: DocumentChecklistProps) {
    const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

    const toggleCheck = (docName: string) => {
        const newChecked = new Set(checkedDocs);
        if (newChecked.has(docName)) {
            newChecked.delete(docName);
        } else {
            newChecked.add(docName);
        }
        setCheckedDocs(newChecked);
    };

    const requiredDocs = documents.filter(d => d.category === '필수');
    const optionalDocs = documents.filter(d => d.category === '우대/추가');

    const renderDocumentItem = (doc: PolicyDocument) => {
        const isChecked = checkedDocs.has(doc.name);

        return (
            <div
                key={doc.name}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${isChecked
                        ? 'border-green-300 bg-green-50'
                        : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
            >
                {/* Checkbox */}
                <button
                    onClick={() => toggleCheck(doc.name)}
                    className="mt-0.5 flex-shrink-0"
                >
                    {isChecked ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                        <Circle className="w-6 h-6 text-slate-400" />
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-semibold ${isChecked ? 'text-green-900' : 'text-slate-900'}`}>
                            {doc.name}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap ${doc.category === '필수'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {doc.category}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                            <FileText className="w-4 h-4" />
                            <span>{doc.whereToGet}</span>
                        </div>
                        {doc.link && (
                            <a
                                href={doc.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                바로가기
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Required Documents */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                    필수 서류 ({requiredDocs.length}개)
                </h3>
                <div className="space-y-3">
                    {requiredDocs.map(renderDocumentItem)}
                </div>
            </div>

            {/* Optional Documents */}
            {optionalDocs.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        우대/추가 서류 ({optionalDocs.length}개)
                    </h3>
                    <div className="space-y-3">
                        {optionalDocs.map(renderDocumentItem)}
                    </div>
                </div>
            )}

            {/* Progress Summary */}
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-900">
                        준비 완료: {checkedDocs.size} / {documents.length}
                    </span>
                    <span className="text-sm text-blue-700">
                        {Math.round((checkedDocs.size / documents.length) * 100)}%
                    </span>
                </div>
                <div className="mt-2 w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(checkedDocs.size / documents.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
