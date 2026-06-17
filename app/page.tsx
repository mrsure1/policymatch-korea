'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import OnboardingForm from '@/components/OnboardingForm';
import PolicyCard from '@/components/PolicyCard';
import EditableTag from '@/components/EditableTag';
import SiteShell from '@/components/SiteShell';
import {
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  Building2,
  ShieldCheck,
  Calendar,
  Database,
  Target,
  Layers,
  Star,
  Check,
} from 'lucide-react';

export default function HomePage() {
  const {
    profile,
    savedProfile,
    isOnboardingComplete,
    hydrated,
    resetProfile,
    updateProfile,
    saveProfileAsMine,
    hydrateFromStorage,
  } = useUserProfileStore();
  const { policies: matchedPolicies, loading, error } = usePolicies(profile);
  const [openTagId, setOpenTagId] = useState<string | null>(null);

  // 앱 로드 시 저장해 둔 "내 조건"을 불러와 바로 매칭 결과를 보여준다.
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // 현재 화면의 조건이 저장된 "내 조건"과 동일한지 여부
  const isProfileSaved = useMemo(
    () =>
      savedProfile != null &&
      (Object.keys(profile) as (keyof typeof profile)[]).every(
        (key) => profile[key] === savedProfile[key]
      ),
    [profile, savedProfile]
  );

  const { matchedList, commonList } = useMemo(() => {
    const genericTokens = ['전체', '전국', '제한없음', '무관'];
    const hasMeaningfulList = (list?: string[]) => {
      if (!list || list.length === 0) return false;
      return !list.some((v) => genericTokens.includes(v));
    };

    const calcScore = (policy: any) => {
      const criteria = policy.criteria || {};
      const regionScore =
        hasMeaningfulList(criteria.regions) &&
        criteria.regions.some((r: string) => profile.region.includes(r))
          ? 1
          : 0;
      const industryScore =
        hasMeaningfulList(criteria.industries) &&
        criteria.industries.some(
          (i: string) => profile.industry.includes(i) || i === '기타'
        )
          ? 1
          : 0;
      const ageScore =
        hasMeaningfulList(criteria.ageGroups) &&
        criteria.ageGroups.includes(profile.age as any)
          ? 1
          : 0;
      const periodScore =
        hasMeaningfulList(criteria.businessPeriods) &&
        criteria.businessPeriods.includes(profile.businessPeriod as any)
          ? 1
          : 0;
      const entityScore =
        hasMeaningfulList(criteria.entityTypes) &&
        criteria.entityTypes.includes(profile.entityType as any)
          ? 1
          : 0;

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

  // 저장된 조건을 불러오기 전에는 온보딩이 잠깐 깜빡이지 않도록 대기한다.
  if (!hydrated) {
    return (
      <SiteShell centered>
        <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
      </SiteShell>
    );
  }

  if (!isOnboardingComplete) {
    return <OnboardingForm />;
  }

  return (
    <SiteShell>
      <header className="site-header">
        <div className="site-container site-header-inner">
          <div className="flex items-center gap-3 min-w-0">
            <div className="site-logo">
              <Building2 className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base lg:text-lg font-bold text-[var(--ink)] truncate leading-tight">
                PolicyMatch Korea
              </h1>
              <p className="text-[11px] lg:text-xs text-[var(--ink-muted)] leading-none mt-0.5">
                정부 정책자금 매칭
              </p>
            </div>
          </div>
          <button type="button" onClick={resetProfile} className="btn-ghost shrink-0">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">프로필 재설정</span>
          </button>
        </div>
      </header>

      <section className="border-b border-[var(--line)] bg-[var(--surface-raised)]">
        <div className="site-container py-8 sm:py-10 lg:py-12 animate-reveal">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 lg:gap-10">
            <div className="space-y-4 lg:max-w-3xl">
              <div className="badge-live">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                2026년 공고 데이터 연동
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] font-bold text-[var(--ink)] leading-tight">
                프로필 기반{' '}
                <span className="text-[var(--primary)]">정책자금 매칭</span>
              </h2>
              <p className="text-[var(--ink-muted)] text-sm sm:text-base lg:text-lg leading-relaxed">
                기업 조건에 맞는 지원사업을 선별하고, 신청 기간·필수 서류를 한 화면에서 확인할 수
                있습니다.
              </p>
            </div>
            <div className="stat-card-grid lg:shrink-0">
              <div className="stat-card">
                <p className="stat-card-label">매칭 공고</p>
                <p className="stat-card-value tabular-nums text-[var(--primary)]">
                  {loading ? '—' : matchedList.length}
                </p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">공통 공고</p>
                <p className="stat-card-value tabular-nums">{loading ? '—' : commonList.length}</p>
              </div>
              <div className="stat-card">
                <p className="stat-card-label">전체</p>
                <p className="stat-card-value tabular-nums">{loading ? '—' : matchedPolicies.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="site-container py-8 lg:py-10">
        <div className="paper-card p-5 sm:p-6 lg:p-8 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 lg:gap-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm lg:text-base font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-3 lg:mb-4">
                매칭 프로필
              </h2>
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
                    color="seal"
                  />
                )}
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
                    options={[
                      '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종',
                      '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
                    ]}
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
                    options={[
                      'IT/소프트웨어', '제조업', '서비스업', '도소매업',
                      '음식/숙박업', '건설업', '교육서비스업', '기타',
                    ]}
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
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <p className="text-xs lg:text-sm text-[var(--ink-muted)]">
                  태그를 클릭하면 조건을 변경할 수 있으며, 결과가 즉시 반영됩니다.
                </p>
                <button
                  type="button"
                  onClick={saveProfileAsMine}
                  disabled={isProfileSaved}
                  className={`shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isProfileSaved
                      ? 'border-[var(--success)] text-[var(--success)] cursor-default'
                      : 'border-[var(--line)] text-[var(--ink)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                  }`}
                >
                  {isProfileSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      내 조건으로 저장됨
                    </>
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5" />
                      내 조건으로 저장
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end shrink-0">
              <span className="feature-item">
                <span className="feature-item-icon">
                  <ShieldCheck className="w-3 h-3" />
                </span>
                공공데이터 기반
              </span>
              <span className="feature-item">
                <span className="feature-item-icon">
                  <Calendar className="w-3 h-3" />
                </span>
                신청기간 검증
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-[rgba(220,38,38,0.25)] bg-[var(--danger-soft)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">데이터를 불러오지 못했습니다</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-[var(--ink)]">
              매칭 결과{' '}
              <span className="text-[var(--primary)] tabular-nums">
                {loading ? '…' : matchedPolicies.length}
              </span>
              건
            </h2>
            <p className="text-[var(--ink-muted)] mt-1 text-sm lg:text-base">
              맞춤 매칭과 공통 조건 공고를 포함한 전체 목록입니다
            </p>
          </div>
          <Link href="/archive" className="btn-primary no-underline shrink-0">
            전체 공고 보기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <p className="text-sm text-[var(--ink-muted)]">정책 데이터를 불러오는 중…</p>
            </div>
          </div>
        ) : matchedPolicies.length > 0 ? (
          <div className="space-y-8 lg:space-y-10">
            {matchedList.length > 0 && (
              <section className="section-matched">
                <div className="section-matched-header flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base lg:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                      <Target className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--primary)] shrink-0" />
                      프로필 일치 공고
                    </h3>
                    <p className="text-xs lg:text-sm text-[var(--ink-muted)] mt-1">
                      지역·업종·연령 등 조건이 일치하는 공고
                    </p>
                  </div>
                  <span className="badge-count">{matchedList.length}건</span>
                </div>
                <div className="policy-grid">
                  {matchedList.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} variant="matched" />
                  ))}
                </div>
              </section>
            )}

            {commonList.length > 0 && (
              <section className="section-common">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 lg:mb-5">
                  <div>
                    <h3 className="text-base lg:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                      <Layers className="w-4 h-4 lg:w-5 lg:h-5 text-[var(--ink-muted)] shrink-0" />
                      공통 공고
                    </h3>
                    <p className="text-xs lg:text-sm text-[var(--ink-muted)] mt-1">
                      전국·전체·무관 등 공통 조건 공고
                    </p>
                  </div>
                  <span className="badge-count">{commonList.length}건</span>
                </div>
                <div className="policy-grid">
                  {commonList.map((policy) => (
                    <PolicyCard key={policy.id} policy={policy} variant="common" />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="paper-card p-12 text-center">
            {error ? (
              <>
                <Database className="w-10 h-10 text-[var(--ink-muted)] mx-auto mb-3 opacity-60" />
                <p className="text-[var(--ink)] font-semibold mb-2">API 연결 상태를 확인해주세요</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  {error || '잠시 후 다시 시도하거나 관리자에게 문의하세요.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-[var(--ink-muted)] mb-2">현재 프로필과 일치하는 정책이 없습니다</p>
                <p className="text-sm text-[var(--ink-muted)]">
                  프로필 조건을 변경하거나 나중에 다시 조회해주세요.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
