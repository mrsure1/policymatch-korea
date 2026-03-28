'use client';

import { useState } from 'react';
import { PolicyDocument } from '@/lib/mockPolicies';
import { filterDocumentsForDisplay } from '@/lib/utils/policyCounts';
import { ExternalLink, FileText, CheckCircle2, Circle } from 'lucide-react';

interface DocumentChecklistProps {
    documents: PolicyDocument[];
    policyUrl?: string;
}

export default function DocumentChecklist({ documents, policyUrl }: DocumentChecklistProps) {
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

    const displayDocuments = filterDocumentsForDisplay(documents);
    const requiredDocs = displayDocuments.filter((d) => d.category === '필수');
    const optionalDocs = displayDocuments.filter((d) => d.category === '우대/추가');
    const totalDocs = displayDocuments.length;
    const progressPercent = totalDocs > 0 ? Math.round((checkedDocs.size / totalDocs) * 100) : 0;

    const formatDocumentLines = (value: string) => {
        if (!value) return [];
        let normalized = value.replace(/\s+/g, ' ').trim();
        normalized = normalized
            .replace(/\s*-\s*/g, '\n')
            .replace(/[•·ㆍ]/g, '\n')
            .replace(/\s*※\s*/g, '\n※ ')
            .replace(/\s*(?=①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)/g, '\n');
        normalized = normalized.replace(/\s*(필수|우대\/추가)\s*$/g, '');
        return normalized
            .split(/\n+/)
            .map((line) => line.trim())
            .filter(Boolean);
    };

    const renderDocumentItem = (doc: PolicyDocument) => {
        const isChecked = checkedDocs.has(doc.name);

        // description 필드가 있으면 사용, 없으면 기존 방식으로 파싱
        const hasDescription = !!doc.description;
        const lines = hasDescription ? [] : formatDocumentLines(doc.name);
        const title = hasDescription ? doc.name : (lines[0] || doc.name);
        const details = hasDescription ? [] : lines.slice(1);

        return (
            <div
                key={doc.name}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${isChecked
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                    }`}
            >
                {/* 체크박스 */}
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

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold ${isChecked ? 'text-green-900' : 'text-slate-900'}`}>
                                {title}
                            </h4>

                            {/* description 필드가 있으면 표시 */}
                            {hasDescription && doc.description && (
                                <p className="mt-1 text-sm text-slate-600">
                                    {doc.description}
                                </p>
                            )}

                            {/* 기존 방식으로 파싱된 details 표시 */}
                            {details.length > 0 && (
                                <ul className="mt-1 list-disc pl-5 space-y-1 text-sm text-slate-600">
                                    {details.map((line, idx) => (
                                        <li key={`${doc.name}-${idx}`}>{line}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
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
                        {(doc.link || policyUrl) && (
                            <a
                                href={doc.link || policyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                공고문 바로가기
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
            {/* 필요 서류 목록 */}
            <div className="space-y-3">
                {requiredDocs.map(renderDocumentItem)}
                {optionalDocs.map(renderDocumentItem)}
            </div>
            {/* 준비 현황 */}
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-900">
                        준비 완료: {checkedDocs.size} / {totalDocs}
                    </span>
                    <span className="text-sm text-blue-700">
                        {progressPercent}%
                    </span>
                </div>
                <div className="mt-2 w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
