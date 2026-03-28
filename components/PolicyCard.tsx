'use client';

import { Policy } from '@/lib/mockPolicies';
import { Clock, TrendingUp, ExternalLink } from 'lucide-react';
import { getPolicySummary } from '@/lib/utils/policyCounts';

interface PolicyCardProps {
    policy: Policy;
    variant?: 'default' | 'matched' | 'common';
}

export default function PolicyCard({ policy, variant = 'default' }: PolicyCardProps) {
    const isAlwaysOpen = /상시|수시|예산\s*소진/.test(policy.applicationPeriod || '');
    const isUnknownDDay = policy.dDay === 999 || policy.dDay == null;
    const isExpired = !isUnknownDDay && policy.dDay < 0;

    const getDDayLabel = () => {
        if (isAlwaysOpen) return '상시모집';
        if (isUnknownDDay) return '기간확인';
        if (isExpired) return '마감';
        if (policy.dDay === 0) return 'D-Day';
        return `D-${policy.dDay}`;
    };

    const getDDayColor = () => {
        if (isAlwaysOpen) return 'bg-green-100 text-green-700';
        if (isUnknownDDay) return 'bg-slate-100 text-slate-500';
        if (isExpired) return 'bg-slate-200 text-slate-500';
        if (policy.dDay <= 7) return 'bg-red-100 text-red-700';
        if (policy.dDay <= 30) return 'bg-orange-100 text-orange-700';
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
    const summaryText = getPolicySummary(policy.summary, policy.detailContent) || '공고문 요약을 준비 중입니다.';
    const showAgency = policy.agency && policy.agency !== '정부기관' && policy.agency !== source.label;

    const variantClass =
        variant === 'matched'
            ? 'glass-card-matched'
            : variant === 'common'
                ? 'glass-card-common'
                : '';

    // 원문 공고 사이트 URL (모바일 URL 우선, 없으면 일반 URL 사용)
    const externalUrl = policy.mobileUrl || policy.url;

    return (
        <a
            href={externalUrl || `/policy/${policy.id}`}
            target={externalUrl ? '_blank' : '_self'}
            rel={externalUrl ? 'noopener noreferrer' : undefined}
            className="h-full"
        >
            <div className={`glass-card ${variantClass} h-full min-h-[280px] rounded-xl border hover:-translate-y-1 hover:shadow-xl transition-all duration-200 p-6 cursor-pointer text-slate-900 flex flex-col ${variant === 'matched' ? 'accent-l border-amber-500/20 hover:border-amber-400/40' : 'border-slate-200/60 hover:border-slate-300/60'}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2" style={{ fontFamily: 'var(--font-display)' }}>
                            {policy.title}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200/80 mt-1">
                            <img src={source.logo} alt={source.label} className="w-4 h-4" />
                            {source.label}
                        </span>
                        {showAgency && (
                            <span className="inline-block px-2 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60 mt-1 ml-2">
                                {policy.agency}
                            </span>
                        )}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold ${getDDayColor()}`}>
                        {getDDayLabel()}
                    </div>
                </div>

                {/* Summary */}
                <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {summaryText}
                </p>

                {/* Info */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-amber-700">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">{policy.supportAmount || '미정'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>{policy.applicationPeriod || '공고문 확인'}</span>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-end">
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                        공고 원문 바로가기
                        <ExternalLink className="w-4 h-4 text-amber-600" />
                    </span>
                </div>
            </div>
        </a>
    );
}
