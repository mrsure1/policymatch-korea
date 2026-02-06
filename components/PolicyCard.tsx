'use client';

import Link from 'next/link';
import { Policy } from '@/lib/mockPolicies';
import { Clock, TrendingUp, ExternalLink } from 'lucide-react';

interface PolicyCardProps {
    policy: Policy;
}

export default function PolicyCard({ policy }: PolicyCardProps) {
    const getDDayColor = (dDay: number) => {
        if (dDay <= 7) return 'bg-red-100 text-red-700';
        if (dDay <= 30) return 'bg-orange-100 text-orange-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <Link href={`/policy/${policy.id}`}>
            <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all p-6 cursor-pointer">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
                            {policy.title}
                        </h3>
                        <p className="text-sm text-slate-600">{policy.agency}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getDDayColor(policy.dDay)}`}>
                        D-{policy.dDay}
                    </div>
                </div>

                {/* Summary */}
                <p className="text-slate-700 text-sm mb-4 line-clamp-2">
                    {policy.summary}
                </p>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-blue-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">{policy.supportAmount || '미정'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{policy.applicationPeriod ? policy.applicationPeriod.split('~')[0].trim() : '상시'}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                        로드맵 {policy.roadmap?.length || 0}단계 • 서류 {policy.documents?.length || 0}개
                    </span>
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                </div>
            </div>
        </Link>
    );
}
