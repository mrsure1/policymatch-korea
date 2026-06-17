'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserProfileStore } from '@/lib/store';
import { ChevronRight, Building2, Check, FileText, BarChart3, Star } from 'lucide-react';
import SiteShell from '@/components/SiteShell';

const ENTITY_TYPES = ['예비창업자', '소상공인', '중소기업'] as const;
const AGE_GROUPS = ['청년 (39세 이하)', '중장년 (40-64세)', '시니어 (65세 이상)'] as const;
const REGIONS = [
    '서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];
const INDUSTRIES = ['IT', '제조업', '서비스', '도소매', '건설업', '음식업', '기타'];
const BUSINESS_PERIODS = ['1년 미만', '1-3년', '3-7년', '7년 이상'] as const;

const FEATURES = [
    { icon: BarChart3, text: '프로필 기반 자동 매칭' },
    { icon: FileText, text: '2026년 최신 공고 반영' },
    { icon: Check, text: '무료 이용' },
];

export default function OnboardingForm() {
    const { profile, updateProfile, completeOnboarding, saveProfileAsMine } = useUserProfileStore();
    const [step, setStep] = useState(0);
    const [justSaved, setJustSaved] = useState(false);
    const totalSteps = 5;

    const handleSaveAsMine = () => {
        saveProfileAsMine();
        setJustSaved(true);
    };

    const handleNext = () => {
        if (step === 0) {
            setStep(1);
        } else if (step < totalSteps) {
            setStep(step + 1);
        } else {
            completeOnboarding();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const isStepValid = () => {
        switch (step) {
            case 0: return true;
            case 1: return profile.entityType !== '';
            case 2: return profile.age !== '';
            case 3: return profile.region !== '';
            case 4: return profile.industry !== '';
            case 5: return profile.businessPeriod !== '';
            default: return false;
        }
    };

    return (
        <SiteShell centered className="animate-fade-in">
            <div className="w-full site-container-narrow">
                {step === 0 && (
                    <div className="paper-card p-8 sm:p-10 lg:p-12 animate-fade-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="site-logo w-11 h-11">
                                <Building2 className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
                                    PolicyMatch Korea
                                </p>
                                <h1 className="text-lg lg:text-xl font-bold text-[var(--ink)] leading-tight">
                                    정책자금 매칭 서비스
                                </h1>
                            </div>
                        </div>

                        <p className="text-[var(--ink-muted)] text-sm lg:text-base leading-relaxed mb-8">
                            기업 프로필을 입력하면 조건에 맞는 정부 지원사업을 자동으로 선별해
                            드립니다.
                        </p>

                        <ul className="space-y-3 mb-8">
                            {FEATURES.map(({ icon: Icon, text }) => (
                                <li key={text} className="feature-item">
                                    <span className="feature-item-icon">
                                        <Icon className="w-3 h-3" />
                                    </span>
                                    {text}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col gap-3">
                            <button type="button" onClick={handleNext} className="btn-primary w-full py-3">
                                매칭 시작하기
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <Link href="/archive" className="btn-secondary w-full py-3 justify-center no-underline">
                                전체 공고 둘러보기
                            </Link>
                        </div>
                    </div>
                )}

                {step > 0 && (
                    <div className="paper-card p-5 sm:p-6 animate-fade-in">
                        <div className="mb-5">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-base font-bold text-[var(--ink)]">기업 프로필 설정</h2>
                                <span className="text-xs font-medium text-[var(--ink-muted)] tabular-nums">
                                    {step} / {totalSteps}
                                </span>
                            </div>
                            <div className="w-full h-1 rounded-full bg-[var(--surface-sunken)] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300 ease-out bg-[var(--primary)]"
                                    style={{ width: `${(step / totalSteps) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="mb-4 min-h-[120px]">
                            {step === 1 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-lg font-bold text-[var(--ink)] mb-1">
                                        사업 유형을 선택해주세요
                                    </h3>
                                    <p className="text-sm text-[var(--ink-muted)] mb-4">해당하는 유형을 하나 선택합니다.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {ENTITY_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => updateProfile({ entityType: type })}
                                                className={`option-card ${profile.entityType === type ? 'option-card-selected' : ''}`}
                                            >
                                                <span className="text-sm font-medium text-[var(--ink)]">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-lg font-bold text-[var(--ink)] mb-1">대표자 연령대</h3>
                                    <p className="text-sm text-[var(--ink-muted)] mb-4">연령별 우대 정책 매칭에 활용됩니다.</p>
                                    <div className="grid grid-cols-1 gap-2.5">
                                        {AGE_GROUPS.map((age) => (
                                            <button
                                                key={age}
                                                type="button"
                                                onClick={() => updateProfile({ age })}
                                                className={`option-card ${profile.age === age ? 'option-card-selected' : ''}`}
                                            >
                                                <span className="text-sm font-medium text-[var(--ink)]">{age}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-lg font-bold text-[var(--ink)] mb-1">사업장 소재지</h3>
                                    <p className="text-sm text-[var(--ink-muted)] mb-4">지역별 지자체 지원사업을 찾습니다.</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                        {REGIONS.map((region) => (
                                            <button
                                                key={region}
                                                type="button"
                                                onClick={() => updateProfile({ region })}
                                                className={`option-chip ${profile.region === region ? 'option-chip-selected' : ''}`}
                                            >
                                                {region}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-lg font-bold text-[var(--ink)] mb-1">주력 업종</h3>
                                    <p className="text-sm text-[var(--ink-muted)] mb-4">업종별 특화 지원사업 매칭에 사용됩니다.</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
                                        {INDUSTRIES.map((industry) => (
                                            <button
                                                key={industry}
                                                type="button"
                                                onClick={() => updateProfile({ industry })}
                                                className={`option-chip ${profile.industry === industry ? 'option-chip-selected' : ''}`}
                                            >
                                                {industry}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-lg font-bold text-[var(--ink)] mb-1">사업 기간</h3>
                                    <p className="text-sm text-[var(--ink-muted)] mb-4">창업 단계별 맞춤 지원을 추천합니다.</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {BUSINESS_PERIODS.map((period) => (
                                            <button
                                                key={period}
                                                type="button"
                                                onClick={() => {
                                                    updateProfile({ businessPeriod: period });
                                                    setJustSaved(false);
                                                }}
                                                className={`option-card ${profile.businessPeriod === period ? 'option-card-selected' : ''}`}
                                            >
                                                <span className="text-sm font-medium text-[var(--ink)]">{period}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {step === totalSteps && (
                            <button
                                type="button"
                                onClick={handleSaveAsMine}
                                disabled={!isStepValid()}
                                className={`w-full mb-3 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                                    justSaved
                                        ? 'border-[var(--success)] bg-[var(--success-soft,var(--surface-sunken))] text-[var(--success)]'
                                        : 'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--ink)] hover:border-[var(--primary)]'
                                } ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {justSaved ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        내 조건으로 저장됨 — 다음부터 바로 검색됩니다
                                    </>
                                ) : (
                                    <>
                                        <Star className="w-4 h-4" />
                                        이 조건을 내 조건으로 저장
                                    </>
                                )}
                            </button>
                        )}

                        <div className="flex gap-2.5 pt-4 border-t border-[var(--line)]">
                            {step > 0 && (
                                <button type="button" onClick={handleBack} className="btn-ghost shrink-0">
                                    이전
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className={`flex-1 btn-primary ${!isStepValid() ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {step === totalSteps ? '매칭 결과 보기' : '다음'}
                                {step < totalSteps && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SiteShell>
    );
}
