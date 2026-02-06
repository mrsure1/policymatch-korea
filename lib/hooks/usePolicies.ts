import { useState, useEffect } from 'react';
import { Policy, UserProfile } from '@/lib/mockPolicies';

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

    useEffect(() => {
        async function fetchPolicies() {
            setLoading(true);

            try {
                // 내 서버의 프록시 API 호출 (/api/policies)
                const response = await fetch('/api/policies');
                const result = await response.json();

                if (result.success && result.data) {
                    const allData = result.data;

                    if (options?.skipFiltering) {
                        // 필터링 없이 전체 반환
                        setPolicies(allData);
                    } else {
                        // API 데이터 클라이언트 사이드 필터링
                        const filteredData = allData.filter((policy: Policy) => {
                            // 1. 지역 (Region)
                            const regionMatch = !policy.criteria?.regions ||
                                policy.criteria.regions.length === 0 ||
                                policy.criteria.regions.includes('전국') ||
                                policy.criteria.regions.includes('전체') ||
                                policy.criteria.regions.some((r: string) => profile.region.includes(r));

                            // 2. 업종 (Industry)
                            const industryMatch = !policy.criteria?.industries ||
                                policy.criteria.industries.length === 0 ||
                                policy.criteria.industries.includes('전체') ||
                                policy.criteria.industries.some((i: string) => profile.industry.includes(i) || i === '기타');

                            // 3. 연령 (Age)
                            const ageMatch = !policy.criteria?.ageGroups ||
                                policy.criteria.ageGroups.length === 0 ||
                                policy.criteria.ageGroups.includes('전체') ||
                                policy.criteria.ageGroups.includes(profile.age as any);

                            // 4. 업력/창업기간 (Business Period)
                            const periodMatch = !policy.criteria?.businessPeriods ||
                                policy.criteria.businessPeriods.length === 0 ||
                                policy.criteria.businessPeriods.includes(profile.businessPeriod as any);

                            // 5. 기업유형 (Entity Type)
                            const entityMatch = !policy.criteria?.entityTypes ||
                                policy.criteria.entityTypes.length === 0 ||
                                policy.criteria.entityTypes.includes(profile.entityType as any);

                            return regionMatch && industryMatch && ageMatch && periodMatch && entityMatch;
                        });

                        setPolicies(filteredData);
                    }

                    setSource('api');
                    setError(null);
                } else {
                    // API 호출 실패 또는 데이터 없음
                    setPolicies([]);
                    setSource('none');
                    // result.error가 있으면 보여주고, 없으면 데이터 없음 메시지
                    setError(result.error || null);
                }
            } catch (err) {
                console.error('정책 불러오기 시스템 오류:', err);
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
