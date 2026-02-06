'use client';

import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import PolicyCard from '@/components/PolicyCard';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { Policy } from '@/lib/mockPolicies';

export default function ArchivePage() {
    const { profile } = useUserProfileStore();
    // skipFiltering: true 옵션으로 모든 데이터 로드
    const { policies, loading, error } = usePolicies(profile, { skipFiltering: true });

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                정책 자료실 (전체 공고)
                            </h1>
                            <p className="text-xs text-slate-500">수집된 2026년 모든 지원사업 리스트</p>
                        </div>
                    </div>
                    <div className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-700">
                            총 {loading ? '...' : policies.length}건
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Intro Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold mb-1">전체 공고 모아보기</h2>
                            <p className="text-indigo-100 text-sm leading-relaxed">
                                매칭 여부와 상관없이, 현재 시스템에 등록된 모든 2026년 정책자금 공고를 확인할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                            <p className="text-slate-500 font-semibold">전체 데이터를 불러오는 중입니다...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="text-slate-800 font-bold mb-1">데이터를 불러올 수 없습니다</p>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                ) : policies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {policies.map((policy) => (
                            <PolicyCard key={policy.id} policy={policy} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <p className="text-slate-600 mb-2">등록된 공고가 없습니다</p>
                        <p className="text-sm text-slate-500">데이터 갱신 스크립트를 실행해주세요.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
