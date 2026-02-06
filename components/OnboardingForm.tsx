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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Hero Screen - Step 0 */}
                {step === 0 && (
                    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">
                                나에게 딱 맞는<br />정책자금 찾기
                            </h1>
                            <p className="text-base text-slate-600 mb-6 leading-relaxed">
                                간단한 질문 5개로<br />
                                맞춤형 정부 지원 정책을 추천해드려요
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6 text-left">
                            <div className="bg-blue-50 rounded-xl p-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-xs font-semibold text-slate-900">정확한 매칭</p>
                                <p className="text-xs text-slate-600 mt-0.5">AI 기반 추천</p>
                            </div>
                            <div className="bg-indigo-50 rounded-xl p-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center mb-2">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-xs font-semibold text-slate-900">신청 가이드</p>
                                <p className="text-xs text-slate-600 mt-0.5">단계별 안내</p>
                            </div>
                            <div className="bg-purple-50 rounded-xl p-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                </div>
                                <p className="text-xs font-semibold text-slate-900">무료 서비스</p>
                                <p className="text-xs text-slate-600 mt-0.5">100% 무료</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleNext}
                                className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                시작하기
                                <ChevronRight className="w-5 h-5" />
                            </button>
                            <Link
                                href="/archive"
                                className="text-sm text-slate-500 hover:text-blue-600 underline decoration-slate-300 underline-offset-4 transition-colors"
                            >
                                전체 공고 모아보기 (자료실)
                            </Link>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">소요시간: 약 1분</p>
                    </div>
                )}

                {/* Question Steps - 1 to 5 */}
                {step > 0 && (
                    <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
                        {/* Selection History */}
                        {step > 1 && (
                            <div className="mb-6 flex flex-wrap gap-2 animate-fade-in">
                                <span className="text-xs font-semibold text-slate-500 flex items-center mr-1">선택 내역:</span>
                                {step > 1 && profile.entityType && (
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center">
                                        <Building2 className="w-3 h-3 mr-1.5" />
                                        {profile.entityType}
                                    </div>
                                )}
                                {step > 2 && profile.age && (
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center">
                                        <User className="w-3 h-3 mr-1.5" />
                                        {profile.age}
                                    </div>
                                )}
                                {step > 3 && profile.region && (
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center">
                                        <MapPin className="w-3 h-3 mr-1.5" />
                                        {profile.region}
                                    </div>
                                )}
                                {step > 4 && profile.industry && (
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 flex items-center">
                                        <Briefcase className="w-3 h-3 mr-1.5" />
                                        {profile.industry}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-slate-700">
                                    질문 {step} / {totalSteps}
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                    {Math.round((step / totalSteps) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: `${(step / totalSteps) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="mb-8">
                            {step === 1 && (
                                <div className="animate-slide-in">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md">
                                            <Building2 className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900">사업자 유형</h2>
                                            <p className="text-slate-600 mt-1">어떤 형태로 사업을 하고 계신가요?</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 mt-6">
                                        {ENTITY_TYPES.map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => updateProfile({ entityType: type })}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-102 ${profile.entityType === type
                                                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <span className="text-lg font-bold text-slate-900">{type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-slide-in">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md">
                                            <User className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900">연령대</h2>
                                            <p className="text-slate-600 mt-1">연령대를 선택해주세요</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 mt-6">
                                        {AGE_GROUPS.map((age) => (
                                            <button
                                                key={age}
                                                onClick={() => updateProfile({ age })}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-102 ${profile.age === age
                                                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <span className="text-lg font-bold text-slate-900">{age}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-slide-in">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md">
                                            <MapPin className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900">사업장 지역</h2>
                                            <p className="text-slate-600 mt-1">사업장이 위치한 지역을 선택해주세요</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-6">
                                        {REGIONS.map((region) => (
                                            <button
                                                key={region}
                                                onClick={() => updateProfile({ region })}
                                                className={`p-3 rounded-xl border-2 text-center transition-all transform hover:scale-105 ${profile.region === region
                                                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <span className="text-sm font-bold text-slate-900">{region}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div className="animate-slide-in">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md">
                                            <Briefcase className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900">업종</h2>
                                            <p className="text-slate-600 mt-1">주요 업종을 선택해주세요</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6 max-h-[280px] overflow-y-auto pr-2">
                                        {INDUSTRIES.map((industry) => (
                                            <button
                                                key={industry}
                                                onClick={() => updateProfile({ industry })}
                                                className={`p-5 rounded-2xl border-2 text-center transition-all transform hover:scale-105 ${profile.industry === industry
                                                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <span className="text-lg font-bold text-slate-900">{industry}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div className="animate-slide-in">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-md">
                                            <Calendar className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold text-slate-900">사업 기간</h2>
                                            <p className="text-slate-600 mt-1">사업을 시작한 지 얼마나 되셨나요?</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 mt-6 max-h-[280px] overflow-y-auto pr-2">
                                        {BUSINESS_PERIODS.map((period) => (
                                            <button
                                                key={period}
                                                onClick={() => updateProfile({ businessPeriod: period })}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all transform hover:scale-102 ${profile.businessPeriod === period
                                                    ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <span className="text-lg font-bold text-slate-900">{period}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-4">
                            {step > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-4 rounded-xl border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-all hover:shadow-md"
                                >
                                    이전
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className={`flex-1 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform ${isStepValid()
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-105'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {step === totalSteps ? '결과 보기' : '다음'}
                                {step < totalSteps && <ChevronRight className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
