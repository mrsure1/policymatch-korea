/**
 * 공공데이터포털 API 클라이언트
 * 
 * 1. K-Startup API - 창업지원사업 공고
 * 2. 중소벤처기업부 - 중소기업지원사업목록
 */

import { Policy } from '@/lib/mockPolicies';

const KSTARTUP_API_KEY = process.env.NEXT_PUBLIC_KSTARTUP_API_KEY || '';
const SME_API_KEY = process.env.NEXT_PUBLIC_SME_SUPPORT_API_KEY || '';

// K-Startup API 엔드포인트
const KSTARTUP_BASE_URL = 'https://apis.data.go.kr/1160100/service/GetKStartupService';

// 중소벤처기업부 API 엔드포인트  
const SME_BASE_URL = 'https://apis.data.go.kr/1160100/service/GetSMEService';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * API 호출 기본 함수
 */
async function fetchFromApi(baseUrl: string, endpoint: string, apiKey: string, params: Record<string, string> = {}): Promise<any> {
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
    }

    const queryParams = new URLSearchParams({
        serviceKey: apiKey,
        resultType: 'json',
        numOfRows: '100',
        pageNo: '1',
        ...params,
    });

    const url = `${baseUrl}${endpoint}?${queryParams}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

/**
 * K-Startup 창업지원사업 공고 조회
 */
export async function getKStartupPolicies(): Promise<ApiResponse<Policy[]>> {
    try {
        const data = await fetchFromApi(KSTARTUP_BASE_URL, '/getStartupSupport', KSTARTUP_API_KEY);

        // API 응답을 Policy 형식으로 변환
        const policies: Policy[] = transformKStartupData(data);

        return {
            success: true,
            data: policies,
        };
    } catch (error) {
        console.error('K-Startup API 오류:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
        };
    }
}

/**
 * 중소벤처기업부 중소기업지원사업 조회
 */
export async function getSMESupportPolicies(): Promise<ApiResponse<Policy[]>> {
    try {
        const data = await fetchFromApi(SME_BASE_URL, '/getSupportList', SME_API_KEY);

        // API 응답을 Policy 형식으로 변환
        const policies: Policy[] = transformSMEData(data);

        return {
            success: true,
            data: policies,
        };
    } catch (error) {
        console.error('중소벤처기업부 API 오류:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
        };
    }
}

/**
 * K-Startup API 데이터 변환
 */
function transformKStartupData(apiData: any): Policy[] {
    // TODO: 실제 API 응답 구조에 맞게 변환 로직 구현
    // 현재는 목 데이터 반환
    return [];
}

/**
 * 중소벤처기업부 API 데이터 변환
 */
function transformSMEData(apiData: any): Policy[] {
    // TODO: 실제 API 응답 구조에 맞게 변환 로직 구현
    // 현재는 목 데이터 반환
    return [];
}

/**
 * API 상태 확인
 */
export function checkApiStatus(): { configured: boolean; message: string; apis: { kstartup: boolean; sme: boolean } } {
    const kstartupConfigured = !!KSTARTUP_API_KEY;
    const smeConfigured = !!SME_API_KEY;

    if (!kstartupConfigured && !smeConfigured) {
        return {
            configured: false,
            message: 'API 키가 설정되지 않았습니다.',
            apis: { kstartup: false, sme: false }
        };
    }

    return {
        configured: true,
        message: `API 연동 완료 (K-Startup: ${kstartupConfigured ? '✓' : '✗'}, 중소기업지원: ${smeConfigured ? '✓' : '✗'})`,
        apis: { kstartup: kstartupConfigured, sme: smeConfigured }
    };
}
