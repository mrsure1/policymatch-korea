'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import OnboardingForm from '@/components/OnboardingForm';
import PolicyCard from '@/components/PolicyCard';
import EditableTag from '@/components/EditableTag';
import {
  RefreshCw,
  User,
  Info,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Layers,
  BarChart3,
} from 'lucide-react';

export default function HomePage() {
  const { profile, isOnboardingComplete, resetProfile, updateProfile } = useUserProfileStore();
  const { policies: matchedPolicies, loading, error, source } = usePolicies(profile);
  const [openTagId, setOpenTagId] = useState<string | null>(null);

  const { matchedList, commonList } = useMemo(() => {
    const genericTokens = ['전체', '전국', '제한없음', '무관'];
    const hasMeaningfulList = (list?: string[]) => {
      if (!list || list.length === 0) return false;
      return !list.some((v) => genericTokens.includes(v));
    };

    const calcScore = (policy: any) => {
      const criteria = policy.criteria || {};
      const regionScore = hasMeaningfulList(criteria.regions)
        && criteria.regions.some((r: string) => profile.region.includes(r))
        ? 1 : 0;
      const industryScore = hasMeaningfulList(criteria.industries)
        && criteria.industries.some((i: string) => profile.industry.includes(i) || i === '기타')
        ? 1 : 0;
      const ageScore = hasMeaningfulList(criteria.ageGroups)
        && criteria.ageGroups.includes(profile.age as any)
        ? 1 : 0;
      const periodScore = hasMeaningfulList(criteria.businessPeriods)
        && criteria.businessPeriods.includes(profile.businessPeriod as any)
        ? 1 : 0;
      const entityScore = hasMeaningfulList(criteria.entityTypes)
        && criteria.entityTypes.includes(profile.entityType as any)
        ? 1 : 0;

      const meaningfulCount =
        (hasMeaningfulList(criteria.regions) ? 1 : 0) +
        (hasMeaningfulList(criteria.industries) ? 1 : 0) +
        (hasMeaningfulList(criteria.ageGroups) ? 1 : 0) +
        (hasMeaningfulList(criteria.businessPeriods) ? 1 : 0) +
        (hasMeaningfulList(criteria.entityTypes) ? 1 : 0);

      const score = regionScore + industryScore + ageScore + periodScore + entityScore;
      return { score, meaningfulCount };
    };

    const matched: any[] = [];
    const common: any[] = [];

    matchedPolicies.forEach((policy) => {
      const { score, meaningfulCount } = calcScore(policy);
      const isGeneric = meaningfulCount === 0;
      if (isGeneric || score === 0) {
        common.push(policy);
      } else {
        matched.push(policy);
      }
    });

    return { matchedList: matched, commonList: common };
  }, [matchedPolicies, profile]);

  if (!isOnboardingComplete) {
    return <OnboardingForm />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />

      {/* Header */}
      <header className="sticky top-0 z-20 glass-dark">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-lg">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">정책자금 매칭</h1>
              <p className="text-xs text-slate-300">나에게 딱 맞는 정부 지원 정책</p>
            </div>
          </div>
          <button
            onClick={resetProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-sky-200/70 bg-sky-300 text-slate-900 font-semibold shadow-sm hover:bg-sky-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-semibold">다시 시작</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-5 pb-3 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-slate-700/40 text-xs font-semibold text-slate-200">
            <Sparkles className="w-4 h-4 text-sky-300" />
            2026 공고 반영 완료
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
            프로필과 정확히 맞는
            <span className="text-sky-300"> 정책 지원금</span>
          </h2>
          <p className="text-slate-200/80 text-base sm:text-lg max-w-xl">
            흩어진 정책을 한곳에서 조회하고, 지금 필요한 지원금만
            선별해 드립니다. 신청 기간과 필수 서류까지
            한 번에 확인하세요.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="glass-dark px-4 py-2 rounded-full text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              신청 일정 검증
            </div>
            <div className="glass-dark px-4 py-2 rounded-full text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-300" />
              지원 분야 연동
            </div>
            <div className="glass-dark px-4 py-2 rounded-full text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-300" />
              매칭 데이터 분석
            </div>
          </div>
        </div>
      </section>

      {/* User Profile Summary */}
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        <div className="glass-card rounded-2xl p-6 mb-6 text-slate-900">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-2">내 프로필</h2>
              <p className="text-xs text-slate-500 mb-3">클릭하여 조건을 변경하면 즉시 매칭 결과가 업데이트됩니다</p>
              <div className="flex flex-wrap gap-2">
                {profile.entityType && (
                  <EditableTag
                    id="entityType"
                    openId={openTagId}
                    setOpenId={setOpenTagId}
                    label=""
                    value={profile.entityType}
                    options={['예비창업자', '소상공인', '중소기업']}
                    onChange={(value) => updateProfile({ entityType: value as any })}
                    color="blue"
                  />
                )}
                {/* ... other tags unchanged ... */}
                {profile.age && (
                  <EditableTag
                    id="age"
                    openId={openTagId}
                    setOpenId={setOpenTagId}
                    label=""
                    value={profile.age}
                    options={['청년 (39세 이하)', '중장년 (40-64세)', '시니어 (65세 이상)']}
                    onChange={(value) => updateProfile({ age: value as any })}
                  />
                )}
                {profile.region && (
                  <EditableTag
                    id="region"
                    openId={openTagId}
                    setOpenId={setOpenTagId}
                    label=""
                    value={profile.region}
                    options={['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']}
                    onChange={(value) => updateProfile({ region: value })}
                  />
                )}
                {profile.industry && (
                  <EditableTag
                    id="industry"
                    openId={openTagId}
                    setOpenId={setOpenTagId}
                    label=""
                    value={profile.industry}
                    options={['IT/소프트웨어', '제조업', '서비스업', '도소매업', '음식/숙박업', '건설업', '교육서비스업', '기타']}
                    onChange={(value) => updateProfile({ industry: value })}
                  />
                )}
                {profile.businessPeriod && (
                  <EditableTag
                    id="businessPeriod"
                    openId={openTagId}
                    setOpenId={setOpenTagId}
                    label="사업기간"
                    value={profile.businessPeriod}
                    options={['1년 미만', '1-3년', '3-7년', '7년 이상']}
                    onChange={(value) => updateProfile({ businessPeriod: value as any })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status/Error Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200/80 bg-red-50/90 flex items-start gap-3 text-slate-900">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">데이터를 불러오지 못했습니다</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              전체 매칭 결과
              <span className="ml-2 text-2xl font-bold text-sky-200 tabular-nums">
                {loading ? '...' : matchedPolicies.length}
              </span>
              개
            </h2>
            <p className="text-slate-300 mt-1">
              프로필 기준으로 조회된 전체 공고(맞춤 매칭 + 공통 공고 포함)입니다
            </p>
          </div>
          <div className="flex items-center gap-3">

            <Link
              href="/archive"
              className="flex items-center gap-1.5 text-sm font-bold text-slate-900 bg-sky-300 px-3 py-2 rounded-full hover:bg-sky-200 transition-colors"
            >
              전체 공고 보러가기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-sky-300 animate-spin" />
              <p className="text-slate-300 font-semibold">실시간 정책 데이터를 조회하고 있습니다...</p>
            </div>
          </div>
        ) : matchedPolicies.length > 0 ? (
          <div className="space-y-10">
            {matchedList.length > 0 && (
              <div className="rounded-2xl border border-sky-300/60 bg-gradient-to-br from-sky-900/70 via-slate-900/55 to-indigo-900/70 p-5 shadow-lg ring-1 ring-sky-300/25">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-sky-100 drop-shadow-sm flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-300" />
                      프로필 핵심 일치 공고
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">지역·업종·연령 등 조건이 실제로 맞는 공고만 모았습니다</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 bg-sky-300 px-3 py-1 rounded-full">
                    {matchedList.length}건
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedList.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} variant="matched" />
                  ))}
                </div>
              </div>
            )}

            {commonList.length > 0 && (
              <div className="rounded-2xl border border-slate-500/40 bg-gradient-to-br from-slate-900/40 via-slate-900/20 to-slate-800/40 p-5 ring-1 ring-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-slate-300" />
                      공통 공고
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">전체/전국/무관 등 공통 조건 공고</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 bg-white/80 px-3 py-1 rounded-full border border-slate-200/80">
                    {commonList.length}건
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {commonList.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} variant="common" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-900">
            {error ? (
              <>
                <p className="text-slate-800 font-bold mb-2">API 연결 상태를 확인해주세요</p>
                <p className="text-sm text-slate-500">잠시 후 다시 시도해주시거나 관리자에게 문의하세요.</p>
              </>
            ) : (
              <>
                <p className="text-slate-600 mb-2">현재 프로필과 일치하는 정책이 없습니다</p>
                <p className="text-sm text-slate-500">프로필 조건을 변경해보시거나 나중에 다시 조회해주세요.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
