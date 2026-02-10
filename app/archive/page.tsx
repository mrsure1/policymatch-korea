'use client';

import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import PolicyCard from '@/components/PolicyCard';
import { ArrowLeft, Loader2, Sparkles, AlertCircle, FileText, Home } from 'lucide-react';
import Link from 'next/link';
import { Policy } from '@/lib/mockPolicies';
import { useRouter } from 'next/navigation';

export default function ArchivePage() {
    const { profile } = useUserProfileStore();
    const router = useRouter();
    // skipFiltering: true 옵션으로 모든 데이터 로드
    const { policies, loading, error } = usePolicies(profile, { skipFiltering: true });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />

            {/* Header */}
            <header className="sticky top-0 z-20 glass-dark">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-700/60 bg-slate-900/60 hover:border-sky-400 hover:bg-slate-800/70 transition-colors text-slate-100 text-sm font-semibold"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                뒤로가기
                            </button>
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-3 py-2 rounded-full border border-sky-400/60 bg-sky-400/10 hover:bg-sky-400/20 transition-colors text-sky-100 text-sm font-semibold"
                            >
                                <Home className="w-4 h-4" />
                                메인으로
                            </Link>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-sky-300" />
                                정책 자료실 (전체 공고)
                            </h1>
                            <p className="text-xs text-slate-300">수집된 2026년 모든 지원사업 리스트</p>
                        </div>
                    </div>
                    <div className="bg-slate-900/60 px-3 py-1 rounded-full border border-slate-700/50">
                        <span className="text-xs font-bold text-sky-200">
                            총 {loading ? '...' : policies.length}건
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 relative z-10">
                {/* Intro Banner */}
                <div className="glass-card rounded-2xl p-6 mb-8 text-slate-900">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center shadow-md">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold mb-1">전체 공고 모아보기</h2>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                매칭 여부와 상관없이, 현재 시스템에 등록된 모든 2026년 정책자금 공고를 확인할 수 있습니다.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-sky-300 animate-spin" />
                            <p className="text-slate-300 font-semibold">전체 데이터를 불러오는 중입니다...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="glass-card rounded-2xl p-8 text-center text-slate-900">
                        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                        <p className="text-slate-800 font-bold mb-1">데이터를 불러올 수 없습니다</p>
                        <p className="text-sm text-slate-500">{error}</p>
                    </div>
                ) : policies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {policies.map((policy) => (
                            <PolicyCard key={policy.id} policy={policy} />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card rounded-2xl p-12 text-center text-slate-900">
                        <p className="text-slate-600 mb-2">등록된 공고가 없습니다</p>
                        <p className="text-sm text-slate-500">데이터 갱신 스크립트를 실행해주세요.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
