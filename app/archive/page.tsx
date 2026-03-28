'use client';

import { useState, useMemo } from 'react';
import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import PolicyCard from '@/components/PolicyCard';
import { Loader2, Sparkles, AlertCircle, FileText, Home, Search, X } from 'lucide-react';
import Link from 'next/link';
import { Policy } from '@/lib/mockPolicies';

export default function ArchivePage() {
    const { profile } = useUserProfileStore();
    // skipFiltering: true 옵션으로 모든 데이터 로드
    const { policies, loading, error } = usePolicies(profile, { skipFiltering: true });
    const [searchQuery, setSearchQuery] = useState('');

    // 키워드 검색 필터링 (제목, 요약, 기관명, 지원금액, 출처플랫폼, 신청기간 대상)
    const filteredPolicies = useMemo(() => {
        if (!searchQuery.trim()) return policies;

        const query = searchQuery.trim().toLowerCase();
        return policies.filter((policy) => {
            const searchTargets = [
                policy.title,
                policy.summary,
                policy.agency,
                policy.supportAmount,
                policy.sourcePlatform || '',
                policy.applicationPeriod || '',
            ];
            return searchTargets.some((field) => field.toLowerCase().includes(query));
        });
    }, [policies, searchQuery]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[url('/bg-mesh.svg')] bg-cover opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[url('/texture-grid.svg')] bg-cover opacity-50 mix-blend-soft-light" />

            {/* Header */}
            <header className="sticky top-0 z-20 glass-dark">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 rounded-full border border-sky-400/60 bg-sky-400/10 hover:bg-sky-400/20 transition-colors text-sky-100 text-sm font-semibold"
                        >
                            <Home className="w-4 h-4" />
                            메인으로
                        </Link>
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
                <div className="glass-card rounded-2xl p-6 mb-6 text-slate-900">
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

                {/* 검색바 */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <input
                            id="archive-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="공고명, 기관명, 지원금액 등 키워드로 검색..."
                            className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400/50 transition-all backdrop-blur-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700/60 transition-colors"
                                aria-label="검색어 지우기"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                    </div>
                    {/* 검색 결과 카운트 */}
                    {searchQuery.trim() && !loading && (
                        <div className="mt-2 flex items-center gap-2 px-1">
                            <span className="text-xs text-slate-400">
                                <span className="font-bold text-sky-300">&quot;{searchQuery.trim()}&quot;</span> 검색 결과{' '}
                                <span className="font-bold text-sky-300">{filteredPolicies.length}</span>건
                            </span>
                        </div>
                    )}
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
                ) : filteredPolicies.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPolicies.map((policy) => (
                            <PolicyCard key={policy.id} policy={policy} />
                        ))}
                    </div>
                ) : searchQuery.trim() ? (
                    <div className="glass-card rounded-2xl p-12 text-center text-slate-900">
                        <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-700 font-bold mb-1">&quot;{searchQuery.trim()}&quot; 에 대한 검색 결과가 없습니다</p>
                        <p className="text-sm text-slate-500">다른 키워드로 다시 검색해보세요.</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 px-4 py-2 rounded-lg bg-sky-500/20 text-sky-700 text-sm font-semibold hover:bg-sky-500/30 transition-colors"
                        >
                            전체 공고 보기
                        </button>
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
