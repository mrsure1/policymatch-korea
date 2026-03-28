import { useState, useEffect } from 'react';
import { Policy, UserProfile } from '@/lib/mockPolicies';

type ScoredPolicy = { policy: Policy; score: number; scoreRatio: number; isGeneric: boolean };

interface UsePoliciesResult {
    policies: Policy[];
    loading: boolean;
    error: string | null;
    source: 'api' | 'none';
}

export function usePolicies(profile: UserProfile, options?: { skipFiltering?: boolean }): UsePoliciesResult {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<'api' | 'none'>('api');

    const normalizeTitle = (title: string) => {
        if (!title) return title;
        let normalized = title.trim();
        // 중복 괄호 정리: "[[기관] 제목" -> "[기관] 제목"
        normalized = normalized.replace(/\[\[/g, '[').replace(/\]\]/g, ']');

        // 여는 괄호만 있으면 제거
        if (normalized.startsWith('[') && !normalized.includes(']')) {
            normalized = normalized.replace('[', '');
        }
        if (normalized.startsWith('(') && !normalized.includes(')')) {
            normalized = normalized.replace('(', '');
        }

        // 닫는 괄호만 있으면 제거
        if (normalized.includes(']') && !normalized.includes('[')) {
            normalized = normalized.replace(']', '');
        }
        if (normalized.includes(')') && !normalized.includes('(')) {
            normalized = normalized.replace(')', '');
        }

        return normalized;
    };

    useEffect(() => {
        async function fetchPolicies() {
            setLoading(true);

            try {
                // 내 서버의 프록시 API 호출 (/api/policies)
                const response = await fetch('/api/policies', {
                    next: { revalidate: 7200 },
                } as RequestInit);
                const result = await response.json();

                if (result.success && result.data) {
                    const allData = result.data.map((policy: Policy) => ({
                        ...policy,
                        title: normalizeTitle(policy.title || ''),
                    }));

                    if (options?.skipFiltering) {
                        // 필터링 없이 전체 반환
                        setPolicies(allData);
                    } else {
                        // API 데이터 클라이언트에서 필터링
                        const filteredData = allData.filter((policy: Policy) => {
                            // 1. 지역(Region)
                            const regionMatch =
                                !policy.criteria?.regions ||
                                policy.criteria.regions.length === 0 ||
                                policy.criteria.regions.includes('전국') ||
                                policy.criteria.regions.includes('전체') ||
                                policy.criteria.regions.some((r: string) => profile.region.includes(r));

                            // 2. 업종(Industry)
                            const industryMatch =
                                !policy.criteria?.industries ||
                                policy.criteria.industries.length === 0 ||
                                policy.criteria.industries.includes('전체') ||
                                policy.criteria.industries.some((i: string) => profile.industry.includes(i) || i === '기타');

                            // 3. 연령(Age)
                            const ageMatch =
                                !policy.criteria?.ageGroups ||
                                policy.criteria.ageGroups.length === 0 ||
                                policy.criteria.ageGroups.includes('전체') ||
                                policy.criteria.ageGroups.includes(profile.age as any);

                            // 4. 업력/창업기간(Business Period)
                            const periodMatch =
                                !policy.criteria?.businessPeriods ||
                                policy.criteria.businessPeriods.length === 0 ||
                                policy.criteria.businessPeriods.includes(profile.businessPeriod as any);

                            // 5. 기업유형(Entity Type)
                            const entityMatch =
                                !policy.criteria?.entityTypes ||
                                policy.criteria.entityTypes.length === 0 ||
                                policy.criteria.entityTypes.includes(profile.entityType as any);

                            return regionMatch && industryMatch && ageMatch && periodMatch && entityMatch;
                        });

                        const genericTokens = ['전체', '전국', '상관없음', '무관'];

                        const scoredData: ScoredPolicy[] = filteredData.map((policy: Policy) => {
                            const criteria = policy.criteria || {};

                            const hasMeaningfulList = (list?: string[]) => {
                                if (!list || list.length === 0) return false;
                                return !list.some((v) => genericTokens.includes(v));
                            };

                            const regionScore =
                                hasMeaningfulList(criteria.regions) &&
                                criteria.regions!.some((r) => profile.region.includes(r))
                                    ? 1
                                    : 0;

                            const industryScore =
                                hasMeaningfulList(criteria.industries) &&
                                criteria.industries!.some((i) => profile.industry.includes(i) || i === '기타')
                                    ? 1
                                    : 0;

                            const ageScore =
                                hasMeaningfulList(criteria.ageGroups) &&
                                criteria.ageGroups!.includes(profile.age as any)
                                    ? 1
                                    : 0;

                            const periodScore =
                                hasMeaningfulList(criteria.businessPeriods) &&
                                criteria.businessPeriods!.includes(profile.businessPeriod as any)
                                    ? 1
                                    : 0;

                            const entityScore =
                                hasMeaningfulList(criteria.entityTypes) &&
                                criteria.entityTypes!.includes(profile.entityType as any)
                                    ? 1
                                    : 0;

                            const score = regionScore + industryScore + ageScore + periodScore + entityScore;
                            const meaningfulCount =
                                (hasMeaningfulList(criteria.regions) ? 1 : 0) +
                                (hasMeaningfulList(criteria.industries) ? 1 : 0) +
                                (hasMeaningfulList(criteria.ageGroups) ? 1 : 0) +
                                (hasMeaningfulList(criteria.businessPeriods) ? 1 : 0) +
                                (hasMeaningfulList(criteria.entityTypes) ? 1 : 0);

                            const isGeneric = meaningfulCount === 0;
                            const scoreRatio = meaningfulCount > 0 ? score / meaningfulCount : 0;

                            return { policy, score, scoreRatio, isGeneric };
                        });

                        scoredData.sort((a: ScoredPolicy, b: ScoredPolicy) => {
                            if (a.isGeneric !== b.isGeneric) return a.isGeneric ? 1 : -1;
                            if (b.scoreRatio !== a.scoreRatio) return b.scoreRatio - a.scoreRatio;
                            if (b.score !== a.score) return b.score - a.score;
                            return 0;
                        });

                        setPolicies(scoredData.map((item) => item.policy));
                    }

                    setSource('api');
                    setError(null);
                } else {
                    // API 호출 실패 또는 데이터 없음
                    setPolicies([]);
                    setSource('none');
                    // result.error가 있으면 표시, 없으면 데이터 없음 메시지
                    setError(result.error || null);
                }
            } catch (err) {
                console.error('정책 불러오기 오류:', err);
                setPolicies([]);
                setSource('none');
                setError('서버 통신 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        }

        fetchPolicies();
    }, [profile]); // 프로필 변경 시 다시 로드

    return { policies, loading, error, source };
}
