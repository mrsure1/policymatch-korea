'use client';

import { useState, useMemo } from 'react';
import { useUserProfileStore } from '@/lib/store';
import { usePolicies } from '@/lib/hooks/usePolicies';
import PolicyCard from '@/components/PolicyCard';
import SiteShell from '@/components/SiteShell';
import { Loader2, AlertCircle, FileText, Home, Search, X } from 'lucide-react';
import Link from 'next/link';

export default function ArchivePage() {
  const { profile } = useUserProfileStore();
  const { policies, loading, error } = usePolicies(profile, { skipFiltering: true });
  const [searchQuery, setSearchQuery] = useState('');

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
    <SiteShell>
      <header className="site-header">
        <div className="site-container site-header-inner">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="btn-ghost py-1.5 px-2.5 no-underline shrink-0">
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-sm">메인</span>
            </Link>
            <div className="h-5 w-px bg-[var(--line)] hidden sm:block" />
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[var(--ink)] truncate leading-tight">
                정책 자료실
              </h1>
              <p className="text-[11px] text-[var(--ink-muted)] leading-none mt-0.5">
                전체 공고 목록
              </p>
            </div>
          </div>
          <span className="badge-count tabular-nums shrink-0">
            총 {loading ? '…' : policies.length.toLocaleString()}건
          </span>
        </div>
      </header>

      <main className="site-container py-8 lg:py-10">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-muted)] pointer-events-none" />
            <input
              id="archive-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="공고명, 기관명, 지원금액 등으로 검색"
              className="field-input pr-10"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--surface-sunken)]"
                aria-label="검색어 지우기"
              >
                <X className="w-4 h-4 text-[var(--ink-muted)]" />
              </button>
            )}
          </div>

          {searchQuery.trim() && !loading && (
            <p className="mt-2 text-xs text-[var(--ink-muted)] px-0.5">
              &quot;{searchQuery.trim()}&quot; 검색 결과{' '}
              <span className="font-semibold text-[var(--primary)] tabular-nums">
                {filteredPolicies.length}
              </span>
              건
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <p className="text-sm text-[var(--ink-muted)]">전체 데이터를 불러오는 중…</p>
            </div>
          </div>
        ) : error ? (
          <div className="paper-card p-8 text-center">
            <AlertCircle className="w-10 h-10 text-[var(--danger)] mx-auto mb-3 opacity-80" />
            <p className="text-[var(--ink)] font-semibold mb-1">데이터를 불러올 수 없습니다</p>
            <p className="text-sm text-[var(--ink-muted)]">{error}</p>
          </div>
        ) : filteredPolicies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {filteredPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        ) : searchQuery.trim() ? (
          <div className="paper-card p-12 text-center">
            <Search className="w-10 h-10 text-[var(--ink-muted)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--ink)] font-semibold mb-1">
              &quot;{searchQuery.trim()}&quot;에 대한 검색 결과가 없습니다
            </p>
            <p className="text-sm text-[var(--ink-muted)] mb-4">다른 키워드로 다시 검색해보세요.</p>
            <button type="button" onClick={() => setSearchQuery('')} className="btn-secondary">
              전체 공고 보기
            </button>
          </div>
        ) : (
          <div className="paper-card p-12 text-center">
            <FileText className="w-10 h-10 text-[var(--ink-muted)] mx-auto mb-3 opacity-50" />
            <p className="text-[var(--ink-muted)] mb-1">등록된 공고가 없습니다</p>
            <p className="text-sm text-[var(--ink-muted)]">데이터 갱신 후 다시 확인해주세요.</p>
          </div>
        )}
      </main>
    </SiteShell>
  );
}
