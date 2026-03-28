'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUserProfileStore } from '@/lib/store';
import { ChevronRight, Building2, User, MapPin, Briefcase, Calendar, Sparkles, TrendingUp, FileText } from 'lucide-react';

const ENTITY_TYPES = ['예비창업자', '소상공인', '중소기업'] as const;
const AGE_GROUPS = ['청년 (39세 이하)', '중장년 (40-64세)', '시니어 (65세 이상)'] as const;
const REGIONS = ['서울', '경기', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const INDUSTRIES = ['IT', '제조업', '서비스', '도소매', '건설업', '음식업', '기타'];
const BUSINESS_PERIODS = ['1년 미만', '1-3년', '3-7년', '7년 이상'] as const;

const optionClass = (selected: boolean, size: 'card' | 'chip' = 'card') => {
    const base =
        size === 'chip'
            ? 'w-full rounded-lg border px-3 py-2 text-center text-sm font-semibold transition-all bg-white/70 hover:bg-white hover:-translate-y-0.5 hover:shadow-md'
            : 'w-full rounded-xl border px-4 py-4 text-left transition-all bg-white/80 hover:bg-white hover:-translate-y-0.5 hover:shadow-md';
    const selectedClass =
        size === 'chip'
            ? 'border-amber-400/70 bg-amber-50 text-slate-900 shadow-sm ring-1 ring-amber-300/40'
            : 'border-amber-400/70 bg-amber-50/90 text-slate-900 shadow-md ring-1 ring-amber-300/30';
    const unselectedClass =
        size === 'chip'
            ? 'border-slate-200/80 text-slate-700 hover:border-amber-300/50'
            : 'border-slate-200/80 text-slate-700 hover:border-amber-300/50';
    return `${base} ${selected ? selectedClass : unselectedClass}`;
};

export default function OnboardingForm() {
    const { profile, updateProfile, completeOnboarding } = useUserProfileStore();
    const [step, setStep] = useState(0); // Start at 0 for hero screen
    const totalSteps = 5;

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
            case 0: return true; // Hero screen
            case 1: return profile.entityType !== '';
            case 2: return profile.age !== '';
            case 3: return profile.region !== '';
            case 4: return profile.industry !== '';
            case 5: return profile.businessPeriod !== '';
            default: return false;
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex items-center justify-center p-4">
            <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />
            <div className="w-full max-w-3xl relative z-10">
                {/* Hero Screen - Step 0 */}
                {step === 0 && (
                    <div className="glass-card rounded-2xl p-10 text-center animate-fade-in text-slate-900">
                        <div className="mb-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-amber-500 mb-6 shadow-lg">
                                <Building2 className="w-8 h-8 text-slate-900" />
                            </div>
                            <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                대한민국 정책자금<br />
                                <span className="text-amber-600">맞춤 매칭 서비스</span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto">
                                복잡한 정부 지원사업,<br />
                                기업 프로필을 분석해 맞는 공고를 찾아드립니다.
                            </p>

                            <div className="flex flex-wrap justify-center gap-3 mb-10">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 rounded-lg border border-amber-200/50">
                                    <TrendingUp className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-slate-700">실시간 데이터 분석</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 rounded-lg border border-amber-200/50">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-slate-700">2026년 최신 공고</span>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50/80 rounded-lg border border-amber-200/50">
                                    <Sparkles className="w-4 h-4 text-amber-600" />
                                    <span className="text-sm font-semibold text-slate-700">100% 무료</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 max-w-md mx-auto">
                            <button
                                onClick={handleNext}
                                className="w-full px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                무료로 매칭 시작하기
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <Link
                                href="/archive"
                                className="text-sm text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1"
                            >
                                전체 공고 리스트 둘러보기
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Question Steps - 1 to 5 */}
                {step > 0 && (
                    <div className="glass-card rounded-2xl p-5 sm:p-6 animate-fade-in text-slate-900">
                        {/* Header & Progress */}
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-900">기업 프로필 설정</h2>
                                <span className="text-sm font-medium text-slate-500">
                                    {step} / {totalSteps}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 transition-all duration-300 ease-out rounded-full"
                                    style={{ width: `${(step / totalSteps) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="mb-3 min-h-[120px]">
                            {step === 1 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">어떤 유형으로 사업 중이신가요?</h3>
                                    <p className="text-slate-500 mb-5">가장 적합한 유형을 선택해주세요.</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {ENTITY_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => updateProfile({ entityType: type })}
                                                className={optionClass(profile.entityType === type, 'card')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-bold">{type}</span>
                                                    {profile.entityType === type && <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">대표자 연령대는 어떻게 되시나요?</h3>
                                    <p className="text-slate-500 mb-5">청년 창업 지원 등 연령별 우대 정책 매칭에 활용됩니다.</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {AGE_GROUPS.map((age) => (
                                            <button
                                                key={age}
                                                onClick={() => updateProfile({ age })}
                                                className={optionClass(profile.age === age, 'card')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-bold">{age}</span>
                                                    {profile.age === age && <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">사업장은 어디에 위치해 있나요?</h3>
                                    <p className="text-slate-500 mb-5">해당 지역의 지자체 지원사업을 찾아드립니다.</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[200px] sm:max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                                        {REGIONS.map((region) => (
                                            <button
                                                key={region}
                                                onClick={() => updateProfile({ region })}
                                                className={optionClass(profile.region === region, 'chip')}
                                            >
                                                {region}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">주력 업종은 무엇인가요?</h3>
                                    <p className="text-slate-500 mb-5">업종별 특화 지원사업 매칭에 필요합니다.</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[190px] sm:max-h-[230px] overflow-y-auto pr-1 custom-scrollbar">
                                        {INDUSTRIES.map((industry) => (
                                            <button
                                                key={industry}
                                                onClick={() => updateProfile({ industry })}
                                                className={optionClass(profile.industry === industry, 'chip')}
                                            >
                                                {industry}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="animate-slide-in">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">사업을 시작한 지 얼마나 되셨나요?</h3>
                                    <p className="text-slate-500 mb-5">창업 초기, 도약기 등 단계별 맞춤 지원을 추천해드립니다.</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {BUSINESS_PERIODS.map((period) => (
                                            <button
                                                key={period}
                                                onClick={() => updateProfile({ businessPeriod: period })}
                                                className={optionClass(profile.businessPeriod === period, 'card')}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-base font-bold">{period}</span>
                                                    {profile.businessPeriod === period && <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            {step > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-3 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                                >
                                    이전으로
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className={`flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isStepValid()
                                    ? 'bg-amber-500 text-slate-900 shadow-lg hover:bg-amber-400 hover:shadow-xl'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {step === totalSteps ? '맞춤 정책 확인하기' : '다음 단계'}
                                {step < totalSteps && <ChevronRight className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
