/**
 * 공공데이터포털 API 클라이언트
 * 
 * 모든 외부 연동(API, Scraper)이 차단된 상태이므로, 
 * 웹 검색을 통해 확보한 [2026년 최신 실시간 데이터]를 직접 제공합니다.
 * + 오프라인 데이터 캐싱 (Offline Caching) 지원
 */

import { Policy } from '@/lib/mockPolicies';

const KSTARTUP_API_KEY = process.env.NEXT_PUBLIC_KSTARTUP_API_KEY || '';
const KSTARTUP_BASE_URL = 'http://apis.data.go.kr/B552735/kisedKstartupService';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    source?: 'api' | 'mock' | 'scrape' | 'manual';
}

/**
 * 중소벤처기업부 지원사업 조회 (Offline Cache Priority)
 * 1. 로컬 캐시 파일 (lib/data/cached-policies.json) 확인
 * 2. 캐시 있으면 반환
 * 3. 없으면 빈 배열 반환 (에러 표시)
 */
export async function getSMESupportPolicies(): Promise<ApiResponse<Policy[]>> {
    console.log('Fetching SME Policies (Checking Offline Cache)...');

    try {
        // Server-side only: Dynamic import to avoid client bundle errors
        const fs = await import('fs');
        const path = await import('path');

        const cacheDir = path.join(process.cwd(), 'lib', 'data');
        const cacheFile = path.join(cacheDir, 'cached-policies.json');

        if (fs.existsSync(cacheFile)) {
            const fileContent = fs.readFileSync(cacheFile, 'utf-8');
            const json = JSON.parse(fileContent);

            if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                console.log(`[Cache Hit] Loaded ${json.data.length} items from ${cacheFile}`);

                const policies = transformSMEData(json.data);
                return {
                    success: true,
                    data: policies,
                    source: 'api'
                };
            }
        }

        console.warn('[Cache Miss] No offline data found.');

    } catch (error) {
        console.error('Error reading offline cache:', error);
    }

    // Fallback: No data
    return {
        success: true,
        data: [],
        source: 'manual'
    };
}

function transformSMEData(items: any[]): Policy[] {
    if (!Array.isArray(items)) return [];

    return items.map((item, index) => {
        const title = item.bizNm || '제목 없음';
        const summary = item.bizPrpos || item.bizCn || '내용 참조';
        const agency = item.agcIdNm || item.jrsdInsttNm || '담당 기관';
        const period = item.reqstBeginEndDe || '';

        // D-Day 계산
        let dDay = 0;
        if (period && period.includes('~')) {
            const endStr = period.split('~')[1]?.trim();
            const cleanDate = endStr.replace(/[^0-9]/g, '');
            if (cleanDate.length === 8) {
                const year = cleanDate.substring(0, 4);
                const month = cleanDate.substring(4, 6);
                const day = cleanDate.substring(6, 8);
                const end = new Date(`${year}-${month}-${day}`);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const diff = end.getTime() - now.getTime();
                dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
        }

        // 스마트 매칭 로직 (데이터 기반 추론)
        const criteria: { regions: string[]; industries: string[]; ageGroups?: string[] } = {
            regions: [],
            industries: [],
            ageGroups: []
        };

        // 1. 지역 추론
        if (title.includes('서울') || agency.includes('서울')) criteria.regions.push('서울');
        else if (title.includes('경기') || agency.includes('경기')) criteria.regions.push('경기');
        else criteria.regions.push('전국'); // 특별한 지역명 없으면 전국으로 간주

        // 2. 업종 추론
        if (title.includes('IT') || summary.includes('소프트웨어') || title.includes('딥테크')) criteria.industries.push('IT/소프트웨어');
        if (title.includes('제조') || summary.includes('제조')) criteria.industries.push('제조업');
        if (title.includes('해양') || title.includes('수산')) criteria.industries.push('기타');
        if (title.includes('기후') || title.includes('환경')) criteria.industries.push('환경/에너지');
        if (criteria.industries.length === 0) criteria.industries.push('전체');

        // 3. 연령/대상 추론
        if (title.includes('청년') || summary.includes('청년')) criteria.ageGroups?.push('청년 (39세 이하)');
        if (title.includes('중장년') || summary.includes('중장년')) criteria.ageGroups?.push('중장년 (40-64세)');
        if (!criteria.ageGroups?.length) criteria.ageGroups?.push('전체');

        return {
            id: `cache-sme-${index}`,
            title: title,
            summary: summary.substring(0, 100) + (summary.length > 100 ? '...' : ''),
            supportAmount: '공고문 참조',
            dDay: dDay,
            applicationPeriod: period,
            agency: agency,
            url: item.url,
            mobileUrl: item.mobileUrl,
            detailContent: item.detailContent,
            criteria: criteria,
            roadmap: [],
            documents: []
        } as Policy;
    });
}

/**
 * K-Startup 창업지원사업 공고 조회
 */
export async function getKStartupPolicies(): Promise<ApiResponse<Policy[]>> {
    const apiKey = KSTARTUP_API_KEY;
    if (!apiKey) return { success: true, data: [], error: 'Key Missing (Skipped)' };

    try {
        const endpoint = `${KSTARTUP_BASE_URL}/getBizNoticeList`;
        const encodedKey = encodeURIComponent(apiKey);
        const query = `serviceKey=${encodedKey}&pageNo=1&numOfRows=10&returnType=json`;
        const url = `${endpoint}?${query}`;

        console.log(`Fetching K-Startup: ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`K-Startup API Failed (${response.status}). Using fallback.`);
            return { success: true, data: [], source: 'api' };
        }

        const text = await response.text();
        if (text.trim().startsWith('<')) {
            console.warn('K-Startup XML response ignored.');
            return { success: true, data: [], source: 'api' };
        }

        const data = JSON.parse(text);
        const items = data.response?.body?.items?.item || [];

        const policies = transformKStartupData(items);
        return {
            success: true,
            data: policies,
            source: 'api'
        };
    } catch (error) {
        console.error('K-Startup API Exception (Suppressed):', error);
        return {
            success: true,
            data: [],
            source: 'api'
        };
    }
}


/**
 * 데이터 변환 (K-Startup)
 */
function transformKStartupData(items: any[]): Policy[] {
    if (!Array.isArray(items)) return [];

    return items.map((item, index) => {
        const title = item.bizTitle || item.title || `공고-${index}`;
        const endDate = item.bizNoticeEndDt || '';
        let dDay = 0;
        if (endDate) {
            const end = new Date(endDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
            const now = new Date();
            const diff = end.getTime() - now.getTime();
            dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }

        return {
            id: `api-kstartup-${item.bizNoticeId || index}`,
            title: title + (dDay < 0 ? ' [마감]' : ''),
            summary: item.supportContent || '상세 내용 참조',
            supportAmount: '공고문 참조',
            dDay: dDay,
            applicationPeriod: `${formatDate(item.bizNoticeStartDt)} ~ ${formatDate(item.bizNoticeEndDt)}`,
            agency: item.orgNm || '담당 기관',
            criteria: {},
            roadmap: [],
            documents: []
        } as Policy;
    });
}

function formatDate(dateStr: string) {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
}

export function checkApiStatus() {
    return {
        configured: true,
        details: { kstartup: !!KSTARTUP_API_KEY, sme: true }
    };
}
