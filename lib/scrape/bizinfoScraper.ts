import * as cheerio from 'cheerio';
import { Policy } from '../mockPolicies';

/**
 * 기업마당(BizInfo) 웹 스크래퍼 (Main Page Version)
 * 공고 목록 페이지 접근 실패 시 메인 페이지의 '최신 공고'라도 가져오기 위함.
 * 대상 URL: https://www.bizinfo.go.kr/web/main/main.do
 */
export async function scrapeBizInfoPolicies(): Promise<Policy[]> {
    const url = 'https://www.bizinfo.go.kr/web/main/main.do';
    console.log(`Scraping BizInfo Main: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Referer': 'https://www.bizinfo.go.kr/'
            }
        });

        if (!response.ok) {
            console.error(`Scrape Error: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const policies: Policy[] = [];
        const seenTitles = new Set();

        // 메인 페이지의 모든 링크 검사
        $('a').each((i, el) => {
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            const href = $(el).attr('href') || '';

            // 정책 공고로 추정되는 조건:
            // 1. 텍스트 길이가 적당함 (10 ~ 100자)
            // 2. 키워드 포함 (사업, 공고, 모집, 지원)
            // 3. 링크가 'view' 관련 (상세보기) 함수나 URL임
            if (text.length < 10 || text.length > 100) return;
            if (!['사업', '공고', '무료', '지원', '참여'].some(k => text.includes(k))) return;
            if (seenTitles.has(text)) return;

            // 제외 키워드
            if (['더보기', '로그인', '회원가입', '사이트맵', '개인정보'].some(k => text.includes(k))) return;

            seenTitles.add(text);

            // 메인 페이지엔 날짜나 기관 정보가 없을 수 있음 -> 임의/추론 값 사용
            policies.push({
                id: `scraped-main-${i}-${Date.now()}`,
                title: text,
                summary: '기업마당 최신 공고입니다. 상세 내용은 홈페이지를 확인하세요.',
                supportAmount: '공고문 참조',
                dDay: 7, // 기본값
                applicationPeriod: '홈페이지 참조',
                agency: '중소벤처기업부/지자체', // 기본값
                criteria: {},
                roadmap: [],
                documents: []
            });
        });

        // 너무 많이 가져오면 지저분하므로 상위 10개만
        const result = policies.slice(0, 10);
        console.log(`Scraper found ${result.length} items from Main Page.`);
        return result;

    } catch (error) {
        console.error('Main Page Scraper Error:', error);
        return [];
    }
}
