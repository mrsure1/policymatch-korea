'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import RoadmapTimeline from '@/components/RoadmapTimeline';
import DocumentChecklist from '@/components/DocumentChecklist';
import { ArrowLeft, Calendar, Building2, TrendingUp, MapPin, FileCheck, Loader2, ExternalLink, AlertTriangle, Info, Map } from 'lucide-react';

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
            <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center">
                <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
                <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />
                <div className="text-center relative z-10">
                    <Loader2 className="w-10 h-10 text-sky-300 animate-spin mx-auto mb-3" />
                    <p className="text-slate-300">정책 정보를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }


    if (!policy) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center p-4">
                <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
                <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />
                <div className="text-center p-8 glass-card rounded-2xl max-w-2xl text-slate-900 relative z-10">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">정책을 찾을 수 없습니다</h1>
                    <p className="text-slate-500 mb-6">
                        요청하신 정책 ID를 찾을 수 없습니다.<br />
                        <span className="text-xs text-slate-400">찾으려는 ID: ({decodedId})</span>
                        <br />
                        <span className="text-xs text-slate-400 mt-2 block">
                            전체 {policies.length}개 정책 로드됨
                        </span>
                    </p>

                    {/* 디버그 로드된 정책 ID 목록 */}
                    {policies.length > 0 && (
                        <div className="bg-white/80 p-4 rounded-lg border border-slate-200 mb-6 text-left">
                            <p className="text-xs font-bold text-slate-700 mb-2">디버그 로드된 정책 ID 목록</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                                {policies.slice(0, 5).map(p => (
                                    <li key={p.id} className="font-mono">
                                        ID: "{p.id}" - {p.title.substring(0, 30)}...
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors font-semibold"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
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

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />
            {/* Header */}
            <header className="sticky top-0 z-20 glass-dark">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-200 hover:text-sky-300 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">뒤로가기</span>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-100 leading-tight">{policy.title}</h1>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-slate-900/60 text-slate-100 px-2 py-1 rounded text-xs font-bold border border-slate-700/60">
                            <img src={source.logo} alt={source.label} className="w-4 h-4" />
                            {source.label}
                        </span>
                        {policy.agency && policy.agency !== '정부기관' && policy.agency !== source.label && (
                            <span className="bg-sky-300 text-slate-900 px-2 py-1 rounded text-xs font-bold border border-sky-200">
                                {policy.agency}
                            </span>
                        )}
                        {policy.dDay >= 0 && (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">D-{policy.dDay}</span>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 relative z-10">

                {/* 1. Official Source Link (Top Priority) */}
                {policy.url && (
                    <div className="glass-card rounded-2xl p-6 text-slate-900">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 shrink-0">
                                    <FileCheck className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        공고 원문 확인하기
                                        <span className="bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm align-middle">OFFICIAL</span>
                                    </h2>
                                    <p className="text-sm text-slate-600 mt-1">
                                        정확한 정보 확인과 신청은 <strong>{policy.agency || '정부'} 공식 사이트</strong>에서 진행해주세요.
                                    </p>
                                </div>
                            </div>
                            <a
                                href={policy.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-sky-300 hover:bg-sky-200 text-slate-900 rounded-full font-bold transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                                공고문 보러가기
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                )}

                {/* Detailed Content (Simulated HWP View) */}
                {policy.detailContent && (
                    <div className="glass-card rounded-2xl p-6 text-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-sky-600" />
                            공고 핵심 내용 (텍스트 미리보기)
                        </h2>
                        <div
                            className="prose prose-sm max-w-none text-slate-700 space-y-2 [&>h3]:text-blue-800 [&>h3]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>h3]:text-base [&>p]:leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: policy.detailContent }}
                        />
                        <p className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-100">
                            * 본 내용은 공고문 원본(HWP/PDF) 내용을 기반으로 정리된 요약/미리보기입니다. 반드시 원본 파일을 다운로드하여 확인하시기 바랍니다.
                        </p>
                    </div>
                )}

                {/* 2. Key Information Summary */}
                <div className="glass-card rounded-2xl p-6 text-slate-900">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-sky-600" />
                        주요 정보 요약
                    </h2>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{policy.summary}</p>
                    <p className="text-xs text-slate-400 mt-2 mb-6 text-right">출처: {policy.agency}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/80 p-4 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold mb-1">지원 내용</p>
                            <p className="font-semibold text-slate-900">
                                {policy.url ? (
                                    <a
                                        href={policy.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1 transition-colors"
                                    >
                                        {policy.supportAmount}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                ) : (
                                    policy.supportAmount
                                )}
                            </p>
                        </div>
                        <div className="bg-white/80 p-4 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold mb-1">신청 기간</p>
                            <p className="font-semibold text-slate-900">{policy.applicationPeriod || '상시'}</p>
                        </div>

                        {/* 소관기관 */}
                        <div className="bg-white/80 p-4 rounded-lg border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold mb-1">소관기관</p>
                            <p className="font-semibold text-slate-900">{policy.agency}</p>
                        </div>

                        {/* 신청방법 */}
                        {policy.applicationMethod && (
                            <div className="bg-white/80 p-4 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 font-bold mb-1">신청방법</p>
                                <p className="font-semibold text-slate-900">{policy.applicationMethod}</p>
                            </div>
                        )}

                        {/* 문의처 */}
                        {policy.inquiry && (
                            <div className="bg-white/80 p-4 rounded-lg border border-slate-100 sm:col-span-2">
                                <p className="text-xs text-slate-500 font-bold mb-1">문의처</p>
                                <p className="font-semibold text-slate-900">{policy.inquiry}</p>
                            </div>
                        )}
                    </div>

                    {/* 지역 정보 */}
                    {policy.criteria?.regions && policy.criteria.regions.length > 0 && (
                        <div className="mt-4 bg-sky-50/80 p-4 rounded-lg border border-sky-100">
                            <p className="text-xs text-sky-700 font-bold mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                지원 대상 지역
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {policy.criteria.regions.map((region, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white text-sky-700 text-xs font-bold rounded-md border border-sky-200">
                                        {region}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Support Criteria (지원 대상 조건) */}
                {(policy.criteria?.entityTypes?.length || policy.criteria?.industries?.length || policy.criteria?.ageGroups?.length || policy.criteria?.businessPeriods?.length) ? (
                    <div className="glass-card rounded-2xl p-6 text-slate-900">
                        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-blue-600" />
                            지원 대상 조건
                        </h2>

                        <div className="space-y-4">
                            {policy.criteria.entityTypes && policy.criteria.entityTypes.length > 0 && (
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-2">기업 유형</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.entityTypes.map((type, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100">
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {policy.criteria.industries && policy.criteria.industries.length > 0 && (
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-2">업종</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.industries.map((industry, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-lg border border-green-100">
                                                {industry}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {policy.criteria.ageGroups && policy.criteria.ageGroups.length > 0 && (
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-2">연령대</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.ageGroups.map((age, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-semibold rounded-lg border border-purple-100">
                                                {age}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {policy.criteria.businessPeriods && policy.criteria.businessPeriods.length > 0 && (
                                <div>
                                    <p className="text-sm font-bold text-slate-700 mb-2">사업 기간</p>
                                    <div className="flex flex-wrap gap-2">
                                        {policy.criteria.businessPeriods.map((period, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm font-semibold rounded-lg border border-orange-100">
                                                {period}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* 4. Disclaimer */}
                <div className="flex items-start gap-3 bg-amber-50/90 border border-amber-200 p-4 rounded-2xl text-sm text-amber-900">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block mb-1">주의사항</span>
                        본 서비스는 공공데이터를 기반으로 정보를 제공하며, 실제 공고 내용과 차이가 있을 수 있습니다.
                        법적 효력이 있는 정확한 내용은 반드시 위 <strong>[공고문 보러가기]</strong> 버튼을 통해 원문에서 확인하시기 바랍니다.
                    </div>
                </div>

                {/* 5. Action Roadmap */}
                {policy.roadmap && policy.roadmap.length > 0 && (
                    <div className="glass-card rounded-2xl p-6 text-slate-900">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Map className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">신청 로드맵 ({policy.roadmap.length}단계)</h2>
                                <p className="text-xs text-slate-500">단계별 신청 절차를 안내합니다</p>
                            </div>
                        </div>
                        <RoadmapTimeline steps={policy.roadmap} />
                    </div>
                )}

                {/* 6. Required Documents */}
                {policy.documents && policy.documents.length > 0 && (
                    <div className="glass-card rounded-2xl p-6 text-slate-900">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <FileCheck className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">필요 서류 ({policy.documents.length}개)</h2>
                                <p className="text-xs text-slate-500">신청 시 필요한 서류를 확인하세요</p>
                            </div>
                        </div>
                        <DocumentChecklist documents={policy.documents} />
                    </div>
                )}
            </div>
        </div>
    );
}
