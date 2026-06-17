'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import { getPolicySummary } from '@/lib/utils/policyCounts';
import { ArrowLeft, TrendingUp, MapPin, FileCheck, Loader2, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import SiteShell from '@/components/SiteShell';
import { isKStartupListSearchUrl, resolveKStartupOfficialUrl } from '@/lib/utils/kstartupUrl';
export const runtime = 'edge'

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useUserProfileStore();

    // 모든 정책 데이터를 로드하여 현재 ID와 일치하는 항목 찾기
    const { policies, loading } = usePolicies(profile, { skipFiltering: true });

    // URL 파라미터 처리
    const policyId = params.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : '';
    const decodedId = decodeURIComponent(policyId);

    const policy = policies.find(p => p.id === decodedId);

    // 디버깅: ID 매칭 확인
    if (!policy && policies.length > 0) {
        console.log('🔍 ID 매칭 실패 디버깅:');
        console.log('- 찾으려는 ID:', decodedId);
        console.log('- DB의 첫 3개 정책 ID:', policies.slice(0, 3).map(p => p.id));
        console.log('- 전체 정책 수:', policies.length);
    }

    if (loading) {
        return (
            <SiteShell centered>
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-3" />
                    <p className="text-[var(--ink-muted)]">정책 정보를 불러오는 중…</p>
                </div>
            </SiteShell>
        );
    }


    if (!policy) {
        return (
            <SiteShell centered>
                <div className="text-center p-8 paper-card max-w-2xl w-full">
                    <h1 className="text-2xl font-bold mb-2">정책을 찾을 수 없습니다</h1>
                    <p className="text-[var(--ink-muted)] mb-6">
                        요청하신 정책 ID를 찾을 수 없습니다.<br />
                        <span className="text-xs">찾으려는 ID: ({decodedId})</span>
                        <br />
                        <span className="text-xs mt-2 block">전체 {policies.length}개 정책 로드됨</span>
                    </p>

                    {policies.length > 0 && (
                        <div className="bg-[var(--paper-deep)] p-4 rounded-lg border border-[var(--line)] mb-6 text-left">
                            <p className="text-xs font-bold mb-2">디버그: 로드된 정책 ID</p>
                            <ul className="text-xs text-[var(--ink-muted)] space-y-1">
                                {policies.slice(0, 5).map(p => (
                                    <li key={p.id} className="font-mono">
                                        ID: &quot;{p.id}&quot; - {p.title.substring(0, 30)}…
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button onClick={() => router.push('/')} className="btn-primary">
                        홈으로 돌아가기
                    </button>
                </div>
            </SiteShell>
        );
    }

    const getSourceMeta = () => {
        const url = (policy?.url || '').toLowerCase()
        const label = policy?.sourcePlatform
            || (url.includes('k-startup.go.kr') ? 'K-Startup' : '')
            || (url.includes('bizinfo.go.kr') ? '기업마당' : '')
            || (url.includes('gov24.go.kr') || url.includes('gov.kr') ? '정부24' : '')
            || (url.includes('smtech.go.kr') ? 'SMTECH' : '')
            || (url.includes('semas.or.kr') || url.includes('sbiz.or.kr') ? '소상공인마당' : '')
            || '정부기관'

        if (label.includes('K-Startup') || url.includes('k-startup.go.kr')) return { label, logo: '/logo-kstartup.svg' }
        if (label.includes('기업마당') || url.includes('bizinfo.go.kr')) return { label, logo: '/logo-bizinfo.svg' }
        if (label.includes('SMTECH') || url.includes('smtech.go.kr')) return { label, logo: '/logo-smtech.svg' }
        if (label.includes('정부24') || url.includes('gov24.go.kr') || url.includes('gov.kr')) return { label, logo: '/logo-gov.svg' }
        if (label.includes('소상공인') || url.includes('semas.or.kr') || url.includes('sbiz.or.kr')) return { label, logo: '/logo-semas.svg' }
        return { label, logo: '/logo-gov.svg' }
    }

    const source = getSourceMeta()
    const disclaimerTitle = '\uC8FC\uC758\uC0AC\uD56D'
    const disclaimerLine1 = '\uBCF8 \uC11C\uBE44\uC2A4\uB294 \uACF5\uACF5\uB370\uC774\uD130\uB97C \uAE30\uBC18\uC73C\uB85C \uC815\uBCF4\uB97C \uC81C\uACF5\uD558\uBA70, \uC2E4\uC81C \uACF5\uACE0 \uB0B4\uC6A9\uACFC \uCC28\uC774\uAC00 \uC788\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
    const disclaimerLine2 = '\uBC95\uC801 \uD6A8\uB825\uC774 \uC788\uB294 \uC815\uD655\uD55C \uB0B4\uC6A9\uC740 \uBC18\uB4DC\uC2DC'
    const disclaimerLinkLabel = '\uACF5\uACE0\uBB38 \uBCF4\uB7EC\uAC00\uAE30'
    const disclaimerLine3 = '\uBC84\uD2BC\uC744 \uD1B5\uD574 \uC6D0\uBB38\uC5D0\uC11C \uD655\uC778\uD558\uC2DC\uAE30 \uBC14\uB78D\uB2C8\uB2E4.'

    const splitSummaryItems = (summary: string) => {
        const raw = (summary || '').replace(/\r/g, '\n').trim()
        if (!raw) return []

        const bulletSplit = raw
            .split(/\n+|[•·ㆍ\u2022]+/)
            .map((item) => item.trim())
            .filter(Boolean)
        if (bulletSplit.length > 1) return bulletSplit

        const dividerSplit = raw
            .split(/\s*(?:\/|\||;)\s*/)
            .map((item) => item.trim())
            .filter(Boolean)
        if (dividerSplit.length > 1) return dividerSplit

        const sentenceNormalized = raw
            .replace(/([.!?])\s+/g, '$1\n')
            .replace(/(다\.|요\.|함\.|됨\.|임\.|니다\.|습니다\.|됩니다\.)\s+/g, '$1\n')
        const sentenceSplit = sentenceNormalized
            .split(/\n+/)
            .map((item) => item.trim())
            .filter(Boolean)

        return sentenceSplit.length > 1 ? sentenceSplit : [raw]
    }

    const summaryItems = splitSummaryItems(getPolicySummary(policy.summary, policy.detailContent))
    const getOfficialUrl = (url?: string, title?: string, policyId?: string) => {
        return resolveKStartupOfficialUrl({
            rawUrl: url,
            title,
            sourceSite: policy?.sourcePlatform,
            policyId,
        })
    }

    const extractSupportAmountFromDetail = (html?: string) => {
        if (!html) return ''
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        const sectionMatch = text.match(/(?:지원\s*내용|지원\s*규모|지원\s*금액|사업화\s*자금)\s*:?\s*([^\.\n]{4,120})/i)
        if (sectionMatch?.[1]) return sectionMatch[1].trim()
        const amountMatch = text.match(/(?:최대|MAX|up to)\s*\d+(?:[.,]\d+)?\s*(?:억원|천만원|백만원|만원|원)?/i)
        return amountMatch?.[0]?.trim() || ''
    }

    const extractPeriodFromDetail = (html?: string) => {
        if (!html) return ''
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        const rangeMatch = text.match(/(20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}\s*(?:~|-)\s*20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})/)
        if (rangeMatch?.[1]) return rangeMatch[1].replace(/\s+/g, ' ').trim()
        return ''
    }

    const officialUrl = getOfficialUrl(policy.url, policy.title, policy.id)
    const officialUrlIsSearchOnly = Boolean(officialUrl && isKStartupListSearchUrl(officialUrl))
    const supportAmountForDisplay =
        policy.supportAmount && !/^(null|undefined|\s*|미정)$/i.test(policy.supportAmount)
            ? policy.supportAmount
            : extractSupportAmountFromDetail(policy.detailContent) || '미정'
    const periodFromDetail = extractPeriodFromDetail(policy.detailContent)
    const applicationPeriodForDisplay =
        policy.applicationPeriod && !/^(null|undefined|\s*)$/i.test(policy.applicationPeriod)
            ? policy.applicationPeriod
            : periodFromDetail || '공고문 확인'
    const isAlwaysOpen = /상시|수시|예산\s*소진/.test(applicationPeriodForDisplay);
    const isUnknownDDay = policy.dDay === 999 || policy.dDay == null;
    const isExpired = !isUnknownDDay && policy.dDay < 0;
    const dDayLabel = isAlwaysOpen ? '상시모집' : isUnknownDDay ? null : isExpired ? '마감' : policy.dDay === 0 ? 'D-Day' : `D-${policy.dDay}`;
    const dDayColor = isAlwaysOpen ? 'badge-dday-open' : isExpired || isUnknownDDay ? 'badge-dday-muted' : (policy.dDay <= 7 ? 'badge-dday-urgent' : policy.dDay <= 30 ? 'badge-dday-warn' : 'badge-dday-normal');

    return (
        <SiteShell>
            <header className="site-header">
                <div className="site-container max-w-5xl py-4 lg:py-5">
                    <button onClick={() => router.back()} className="btn-ghost mb-3 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        뒤로가기
                    </button>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-snug">{policy.title}</h1>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-[var(--surface-sunken)] px-2 py-1 rounded text-xs font-medium border border-[var(--line)]">
                            <img src={source.logo} alt={source.label} className="w-4 h-4" />
                            {source.label}
                        </span>
                        {policy.agency && policy.agency !== '정부기관' && policy.agency !== source.label && (
                            <span className="bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-1 rounded text-xs font-medium border border-[rgba(30,64,175,0.15)]">
                                {policy.agency}
                            </span>
                        )}
                        {dDayLabel && (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${dDayColor}`}>{dDayLabel}</span>
                        )}
                    </div>
                </div>
            </header>

            <div className="site-container max-w-5xl py-6 lg:py-8 space-y-6 lg:space-y-8 pb-12">

                {officialUrl && (
                    <div className="paper-card p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-lg bg-[var(--primary)] shrink-0">
                                    <FileCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">공고 원문 확인</h2>
                                    <p className="text-sm text-[var(--ink-muted)] mt-1">
                                        {officialUrlIsSearchOnly ? (
                                            <>
                                                이 공고는 K-Startup에 직접 연결되는 원문 URL이 없어{' '}
                                                <strong className="text-[var(--ink-secondary)]">유사 키워드 검색</strong>
                                                으로 안내됩니다. 검색 결과에 해당 공고가 없을 수 있습니다.
                                            </>
                                        ) : (
                                            <>
                                                정확한 정보 확인과 신청은{' '}
                                                <strong className="text-[var(--ink-secondary)]">{policy.agency || '정부'} 공식 사이트</strong>
                                                에서 진행해주세요.
                                            </>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full sm:w-auto whitespace-nowrap no-underline">
                                {officialUrlIsSearchOnly ? 'K-Startup에서 검색' : '공고문 보러가기'}
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                )}

                {policy.detailContent && (
                    <div className="paper-card p-5 sm:p-6">
                        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                            <Info className="w-4 h-4 text-[var(--primary)]" />
                            공고 핵심 내용
                        </h2>
                        <div className="prose-policy max-w-none space-y-2" dangerouslySetInnerHTML={{ __html: policy.detailContent }} />
                        <p className="text-xs text-[var(--ink-muted)] mt-6 pt-4 border-t border-[var(--line)]">
                            * 본 내용은 공고문 원본(HWP/PDF) 내용을 기반으로 정리된 요약/미리보기입니다. 반드시 원본 파일을 다운로드하여 확인하시기 바랍니다.
                        </p>
                    </div>
                )}

                <div className="paper-card p-5 sm:p-6">
                    <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                        주요 정보 요약
                    </h2>
                    {summaryItems.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-[var(--ink-muted)]">
                            {summaryItems.map((item, index) => (
                                <li key={`${item}-${index}`} className="leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-[var(--ink-muted)]">요약 정보가 없습니다.</p>
                    )}
                    <p className="text-xs text-[var(--ink-muted)] mt-2 mb-6 text-right">출처: {policy.agency}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-[var(--surface-sunken)] p-4 rounded-lg border border-[var(--line)]">
                            <p className="text-xs text-[var(--ink-muted)] font-medium mb-1">지원 내용</p>
                            <p className="font-semibold text-sm">
                                {officialUrl ? (
                                    <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline inline-flex items-center gap-1">
                                        {supportAmountForDisplay}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    supportAmountForDisplay
                                )}
                            </p>
                        </div>
                        <div className="bg-[var(--surface-sunken)] p-4 rounded-lg border border-[var(--line)]">
                            <p className="text-xs text-[var(--ink-muted)] font-medium mb-1">신청 기간</p>
                            <p className="font-semibold text-sm">{applicationPeriodForDisplay}</p>
                        </div>

                        <div className="bg-[var(--surface-sunken)] p-4 rounded-lg border border-[var(--line)]">
                            <p className="text-xs text-[var(--ink-muted)] font-medium mb-1">소관기관</p>
                            <p className="font-semibold text-sm">{policy.agency}</p>
                        </div>

                        {policy.applicationMethod && (
                            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg border border-[var(--line)]">
                                <p className="text-xs text-[var(--ink-muted)] font-medium mb-1">신청방법</p>
                                <p className="font-semibold text-sm">{policy.applicationMethod}</p>
                            </div>
                        )}

                        {policy.inquiry && (
                            <div className="bg-[var(--surface-sunken)] p-4 rounded-lg border border-[var(--line)] sm:col-span-2">
                                <p className="text-xs text-[var(--ink-muted)] font-medium mb-1">문의처</p>
                                <p className="font-semibold text-sm">{policy.inquiry}</p>
                            </div>
                        )}
                    </div>

                    {policy.criteria?.regions && policy.criteria.regions.length > 0 && (
                        <div className="mt-4 bg-[var(--success-soft)] p-4 rounded-lg border border-[rgba(5,150,105,0.15)]">
                            <p className="text-xs text-[var(--success)] font-semibold mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                지원 대상 지역
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {policy.criteria.regions.map((region, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-[var(--surface-raised)] text-[var(--success)] text-xs font-medium rounded border border-[rgba(5,150,105,0.2)]">
                                        {region}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Support Criteria (지원 대상 조건) */}
                {(policy.criteria?.entityTypes?.length || policy.criteria?.industries?.length || policy.criteria?.ageGroups?.length || policy.criteria?.businessPeriods?.length) ? (
                    <div className="paper-card p-5 sm:p-6">
                        <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-[var(--primary)]" />
                            지원 대상 조건
                        </h2>

                        <div className="space-y-4">
                            {policy.criteria.entityTypes && policy.criteria.entityTypes.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-2 text-[var(--ink-secondary)]">기업 유형</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.entityTypes.map((type, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-[var(--primary-soft)] text-[var(--primary)] text-sm font-medium rounded border border-[rgba(30,64,175,0.15)]">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {policy.criteria.industries && policy.criteria.industries.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-2 text-[var(--ink-secondary)]">업종</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.industries.map((industry, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-[var(--success-soft)] text-[var(--success)] text-sm font-medium rounded border border-[rgba(5,150,105,0.15)]">
                                                {industry}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {policy.criteria.ageGroups && policy.criteria.ageGroups.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-2 text-[var(--ink-secondary)]">연령대</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.ageGroups.map((age, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-[var(--surface-sunken)] text-[var(--ink-secondary)] text-sm font-medium rounded border border-[var(--line)]">
                                                {age}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {policy.criteria.businessPeriods && policy.criteria.businessPeriods.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold mb-2 text-[var(--ink-secondary)]">사업 기간</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.businessPeriods.map((period, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-[var(--surface-sunken)] text-[var(--ink-secondary)] text-sm font-medium rounded border border-[var(--line)]">
                                                {period}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* 주의사항 */}
                <div className="flex items-start gap-3 bg-[var(--warning-soft)] border border-[rgba(180,83,9,0.2)] p-4 rounded-lg text-sm">
                    <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-1">{disclaimerTitle}</span>
                        {disclaimerLine1}
                        {' '}
                        {disclaimerLine2}
                        {' '}
                        <strong>[{disclaimerLinkLabel}]</strong>
                        {' '}
                        {disclaimerLine3}
                    </div>
                </div>




            </div>
        </SiteShell>
    );
}
