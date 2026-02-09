'use client';

import Link from 'next/link';
import { Policy } from '@/lib/mockPolicies';
import { Clock, TrendingUp, ExternalLink } from 'lucide-react';

interface PolicyCardProps {
    policy: Policy;
    variant?: 'default' | 'matched' | 'common';
}

export default function PolicyCard({ policy, variant = 'default' }: PolicyCardProps) {
    const getDDayColor = (dDay: number) => {
        if (dDay <= 7) return 'bg-red-100 text-red-700';
        if (dDay <= 30) return 'bg-orange-100 text-orange-700';
        return 'bg-blue-100 text-blue-700';
    };

    const getSourceMeta = () => {
        const url = (policy.url || '').toLowerCase();
        const label = policy.sourcePlatform
            || (url.includes('k-startup.go.kr') ? 'K-Startup' : '')
            || (url.includes('bizinfo.go.kr') ? '기업마당' : '')
            || (url.includes('gov24.go.kr') || url.includes('gov.kr') ? '정부24' : '')
            || (url.includes('smtech.go.kr') ? 'SMTECH' : '')
            || (url.includes('semas.or.kr') || url.includes('sbiz.or.kr') ? '소상공인마당' : '')
            || '정부기관';

        if (label.includes('K-Startup') || url.includes('k-startup.go.kr')) {
            return { label, logo: '/logo-kstartup.svg' };
        }
        if (label.includes('기업마당') || url.includes('bizinfo.go.kr')) {
            return { label, logo: '/logo-bizinfo.svg' };
        }
        if (label.includes('SMTECH') || url.includes('smtech.go.kr')) {
            return { label, logo: '/logo-smtech.svg' };
        }
        if (label.includes('정부24') || url.includes('gov24.go.kr') || url.includes('gov.kr')) {
            return { label, logo: '/logo-gov.svg' };
        }
        if (label.includes('소상공인') || url.includes('semas.or.kr') || url.includes('sbiz.or.kr')) {
            return { label, logo: '/logo-semas.svg' };
        }
        return { label, logo: '/logo-gov.svg' };
    };

    const source = getSourceMeta();
    const showAgency = policy.agency && policy.agency !== '정부기관' && policy.agency !== source.label;

    const variantClass =
        variant === 'matched'
            ? 'glass-card-matched'
            : variant === 'common'
                ? 'glass-card-common'
                : '';

    return (
        <Link href={`/policy/${policy.id}`}>
            <div className={`glass-card ${variantClass} rounded-2xl border border-white/40 hover:border-sky-300/60 hover:-translate-y-1 hover:shadow-2xl transition-all p-6 cursor-pointer text-slate-900`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">
                            {policy.title}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 mt-1">
                            <img src={source.logo} alt={source.label} className="w-4 h-4" />
                            {source.label}
                        </span>
                        {showAgency && (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100 mt-1 ml-2">
                                {policy.agency}
                            </span>
                        )}
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
                    <div className="flex items-center gap-1 text-sky-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-semibold">{policy.supportAmount || '미정'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{policy.applicationPeriod || '\uC0C1\uC2DC'}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                        로드맵 {policy.roadmap?.length || 0}단계 • 서류 {policy.documents?.length || 0}개
                    </span>
                    <ExternalLink className="w-4 h-4 text-sky-600" />
                </div>
            </div>
        </Link>
    );
}
