'use client';

import { Policy } from '@/lib/mockPolicies';
import { Clock, Banknote, ExternalLink, ChevronRight } from 'lucide-react';
import { getPolicySummary } from '@/lib/utils/policyCounts';
import { resolvePolicyCardHref } from '@/lib/utils/kstartupUrl';
import {
    formatApplicationPeriodDisplay,
    normalizeSupportAmount,
} from '@/lib/utils/policyDisplay';

interface PolicyCardProps {
    policy: Policy;
    variant?: 'default' | 'matched' | 'common';
}

export default function PolicyCard({ policy, variant = 'default' }: PolicyCardProps) {
    const applicationPeriod = formatApplicationPeriodDisplay(policy.applicationPeriod);
    const supportAmount = normalizeSupportAmount(policy.supportAmount);
    const isAlwaysOpen = /상시|수시|예산\s*소진|세부사업별\s*상이/.test(applicationPeriod);
    const isUnknownDDay = policy.dDay === 999 || policy.dDay == null;
    const isExpired = !isUnknownDDay && policy.dDay < 0;

    const getDDayLabel = () => {
        if (/세부사업별\s*상이/.test(applicationPeriod)) return '세부별 상이';
        if (isAlwaysOpen) return '상시';
        if (isUnknownDDay) return '기간확인';
        if (isExpired) return '마감';
        if (policy.dDay === 0) return 'D-Day';
        return `D-${policy.dDay}`;
    };

    const getDDayBadgeClass = () => {
        if (isAlwaysOpen) return 'badge-dday-open';
        if (isUnknownDDay || isExpired) return 'badge-dday-muted';
        if ((policy.dDay ?? 999) <= 7) return 'badge-dday-urgent';
        if ((policy.dDay ?? 999) <= 30) return 'badge-dday-warn';
        return 'badge-dday-normal';
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

    const variantFrame =
        variant === 'matched'
            ? 'paper-card paper-card-accent'
            : variant === 'common'
                ? 'paper-card-muted'
                : 'paper-card';

    const { href: cardHref, openInNewTab } = resolvePolicyCardHref(policy);
    const hasDirectExternalLink = openInNewTab && cardHref.startsWith('http');

    return (
        <a
            href={cardHref}
            target={openInNewTab ? '_blank' : '_self'}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className="group block h-full no-underline"
        >
            <div
                className={`${variantFrame} policy-card-inner h-full cursor-pointer flex flex-col transition-shadow duration-150 hover:shadow-[var(--shadow)]`}
            >
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--surface-sunken)] text-[var(--ink-muted)] border border-[var(--line)]">
                            <img src={source.logo} alt="" className="w-3.5 h-3.5" />
                            {source.label}
                        </span>
                        {showAgency && (
                            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--primary-soft)] text-[var(--primary)] border border-[rgba(30,64,175,0.15)]">
                                {policy.agency}
                            </span>
                        )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 tabular-nums ${getDDayBadgeClass()}`}>
                        {getDDayLabel()}
                    </span>
                </div>

                <h3 className="policy-card-title text-[var(--ink)] mb-2 line-clamp-2 leading-snug group-hover:text-[var(--primary)] transition-colors">
                    {policy.title}
                </h3>

                <p className="text-[var(--ink-muted)] text-xs mb-4 line-clamp-2 flex-1 leading-relaxed">
                    {summaryText}
                </p>

                <div className="flex items-center gap-4 text-xs text-[var(--ink-muted)] pt-3 border-t border-[var(--line)]">
                    {supportAmount && (
                        <div className="flex items-center gap-1">
                            <Banknote className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
                            <span className="font-medium text-[var(--ink-secondary)]">
                                {supportAmount}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 min-w-0">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{applicationPeriod}</span>
                    </div>
                    <span className="ml-auto flex items-center gap-0.5 text-[var(--primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {hasDirectExternalLink ? '원문' : '상세'}
                        {hasDirectExternalLink ? (
                            <ExternalLink className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                    </span>
                </div>
            </div>
        </a>
    );
}
