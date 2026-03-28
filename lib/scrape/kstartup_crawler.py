"""
K-Startup 공지사항 크롤러

동적 링크(JavaScript onclick, POST)를 처리하여 상세 페이지 URL을 추출합니다.
Playwright를 사용해 JavaScript 렌더링된 페이지에서 go_view(id) 패턴을 파싱합니다.
"""

from __future__ import annotations

import asyncio
import logging
import re
import time
from dataclasses import dataclass
from typing import Optional

from playwright.async_api import async_playwright, Page, Browser, BrowserContext

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 상수 정의
BASE_URL = "https://www.k-startup.go.kr"
LIST_URL = f"{BASE_URL}/web/contents/bizpbanc-ongoing.do"
DETAIL_URL_TEMPLATE = f"{BASE_URL}/web/contents/bizpbanc-detail.do?pbancSn={{id}}"

# 요청 간 딜레이 (초) - 서버 차단 방지
REQUEST_DELAY = 2.0
# 상세 페이지 로딩 대기 (초)
DETAIL_WAIT = 3.0
# 재시도 횟수
MAX_RETRIES = 3
# 재시도 대기 (초)
RETRY_DELAY = 5.0


@dataclass
class KStartupNoticeItem:
    """K-Startup 공지 항목 데이터 클래스"""
    notice_id: str
    title: str
    detail_url: str
    raw_link: Optional[str] = None


def extract_ids_from_go_view(html: str) -> list[tuple[str, str]]:
    """
    HTML 소스에서 go_view(id) 패턴을 추출하여 (id, 제목) 튜플 리스트 반환.

    K-Startup 리스트 페이지는 href 대신 onclick="go_view(176066)" 형태로
    상세 페이지 ID를 전달합니다. 이 함수는 해당 패턴을 정규식으로 파싱합니다.

    Args:
        html: HTML 소스 문자열

    Returns:
        [(notice_id, title_snippet), ...] - 제목은 근접 텍스트(최대 50자)
    """
    # go_view(숫자) 패턴 매칭
    pattern = re.compile(r'go_view\s*\(\s*(\d+)\s*\)', re.IGNORECASE)
    ids_found: list[str] = []
    for match in pattern.finditer(html):
        ids_found.append(match.group(1))

    # 중복 제거, 순서 유지
    seen: set[str] = set()
    unique_ids: list[str] = []
    for nid in ids_found:
        if nid not in seen:
            seen.add(nid)
            unique_ids.append(nid)

    # 제목 추출 시도: go_view 근처의 텍스트 (td, a 태그 내부)
    # 패턴: <a ... onclick="go_view(123)">제목</a> 또는 <td>제목</td> 근처
    results: list[tuple[str, str]] = []
    for nid in unique_ids:
        # 제목용: go_view(id) 앞뒤 200자 내 텍스트 검색
        ctx_pattern = re.compile(
            rf'.{{0,200}}go_view\s*\(\s*{re.escape(nid)}\s*\).{{0,200}}',
            re.DOTALL | re.IGNORECASE
        )
        ctx_match = ctx_pattern.search(html)
        title_snippet = ""
        if ctx_match:
            ctx = ctx_match.group(0)
            # HTML 태그 제거
            title_snippet = re.sub(r'<[^>]+>', ' ', ctx)
            title_snippet = re.sub(r'\s+', ' ', title_snippet).strip()[:80]

        results.append((nid, title_snippet or f"공고 {nid}"))

    return results


def build_detail_url(notice_id: str) -> str:
    """
    공고 ID로 상세 페이지 URL 생성.

    Args:
        notice_id: go_view()에 전달되는 숫자 ID

    Returns:
        완전한 상세 페이지 URL
    """
    return DETAIL_URL_TEMPLATE.format(id=notice_id)


async def fetch_list_with_playwright(
    page: Page,
    max_items: int = 50,
) -> list[KStartupNoticeItem]:
    """
    Playwright Page를 사용해 K-Startup 리스트 페이지에서 공고 목록 수집.

    리스트 페이지를 로드한 후 HTML에서 go_view(id) 패턴을 추출하고,
    각 항목에 대한 상세 URL을 생성합니다.

    Args:
        page: Playwright Page 객체
        max_items: 최대 수집 개수

    Returns:
        KStartupNoticeItem 리스트
    """
    try:
        logger.info("리스트 페이지 로딩 중: %s", LIST_URL)
        response = await page.goto(LIST_URL, wait_until="networkidle", timeout=60000)

        if not response or response.status >= 400:
            logger.warning("리스트 페이지 로드 실패: status=%s", getattr(response, "status", None))
            return []

        # 대기열/접속제한 페이지 감지
        content = await page.content()
        if "서비스 접속 대기 중" in content or "접속이 차단" in content:
            logger.warning("K-Startup 대기열/차단 감지. 10초 대기 후 재시도...")
            await asyncio.sleep(10)
            return await fetch_list_with_playwright(page, max_items)

        # 실제 목록 영역 로드 대기 (테이블 또는 리스트)
        await page.wait_for_selector(
            "table, .list-board, .board-list, [class*='list']",
            timeout=15000
        )
        await asyncio.sleep(REQUEST_DELAY)

        html = await page.content()
        extracted = extract_ids_from_go_view(html)

        items: list[KStartupNoticeItem] = []
        for notice_id, title in extracted[:max_items]:
            detail_url = build_detail_url(notice_id)
            items.append(KStartupNoticeItem(
                notice_id=notice_id,
                title=title.strip(),
                detail_url=detail_url,
                raw_link=f"javascript:go_view({notice_id})",
            ))

        logger.info("공고 %d건 추출 완료", len(items))
        return items

    except Exception as e:
        logger.exception("리스트 수집 실패: %s", e)
        raise


async def fetch_detail_content(
    page: Page,
    detail_url: str,
    notice_id: str,
) -> Optional[str]:
    """
    상세 페이지로 이동하여 본문 HTML 추출.

    Args:
        page: Playwright Page 객체
        detail_url: 상세 페이지 URL
        notice_id: 공고 ID (로깅용)

    Returns:
        본문 영역 HTML 또는 None (실패 시)
    """
    for attempt in range(MAX_RETRIES):
        try:
            await asyncio.sleep(REQUEST_DELAY)
            response = await page.goto(detail_url, wait_until="networkidle", timeout=30000)

            if not response or response.status >= 400:
                logger.warning("상세 로드 실패 [%s] attempt=%d: %s", notice_id, attempt + 1, getattr(response, "status", None))
                await asyncio.sleep(RETRY_DELAY)
                continue

            # 대기열/차단 감지
            content = await page.content()
            if "서비스 접속 대기 중" in content or "접속이 차단" in content:
                logger.warning("대기열/차단 - 15초 대기")
                await asyncio.sleep(15)
                continue

            # 본문 영역 선택자 (K-Startup 실제 구조에 맞게 조정)
            selectors = [
                ".view-content",
                ".bbs-view-content",
                ".detail-content",
                "[class*='view']",
                ".contents",
                "article",
                "main",
            ]

            body_html: Optional[str] = None
            for sel in selectors:
                try:
                    el = await page.query_selector(sel)
                    if el:
                        body_html = await el.inner_html()
                        if body_html and len(body_html) > 100:
                            break
                except Exception:
                    continue

            if not body_html:
                body_html = await page.evaluate("""
                    () => {
                        const main = document.querySelector('main, .contents, #contents');
                        return main ? main.innerHTML : document.body.innerHTML;
                    }
                """)

            return body_html

        except Exception as e:
            logger.warning("상세 수집 실패 [%s] attempt=%d: %s", notice_id, attempt + 1, e)
            await asyncio.sleep(RETRY_DELAY)

    return None


async def crawl_kstartup_notices(
    headless: bool = True,
    max_list_items: int = 30,
    max_detail_pages: int = 10,
) -> list[dict]:
    """
    K-Startup 공지사항 전체 크롤링 파이프라인.

    1. 리스트 페이지에서 go_view(id) 추출
    2. 각 상세 페이지 방문하여 본문 HTML 수집
    3. 딜레이와 재시도로 서버 부하 완화

    Args:
        headless: 브라우저 헤드리스 모드
        max_list_items: 리스트 최대 수집 개수
        max_detail_pages: 상세 페이지 최대 방문 개수

    Returns:
        [{"notice_id", "title", "detail_url", "body_html"}, ...]
    """
    results: list[dict] = []

    async with async_playwright() as p:
        browser: Browser = await p.chromium.launch(headless=headless)
        context: BrowserContext = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )

        try:
            page = await context.new_page()

            # 리스트 수집
            items = await fetch_list_with_playwright(page, max_items=max_list_items)
            to_fetch = min(len(items), max_detail_pages)

            for i, item in enumerate(items[:to_fetch]):
                logger.info("[%d/%d] 상세 수집: %s", i + 1, to_fetch, item.title[:40])
                body_html = await fetch_detail_content(page, item.detail_url, item.notice_id)

                results.append({
                    "notice_id": item.notice_id,
                    "title": item.title,
                    "detail_url": item.detail_url,
                    "body_html": body_html or "",
                    "raw_link": item.raw_link,
                })

        finally:
            await browser.close()

    return results


# CLI 실행
if __name__ == "__main__":
    async def main():
        data = await crawl_kstartup_notices(
            headless=True,
            max_list_items=5,
            max_detail_pages=3,
        )
        for d in data:
            print(f"[{d['notice_id']}] {d['title'][:50]}")
            print(f"  URL: {d['detail_url']}")
            print(f"  Body length: {len(d.get('body_html', '') or '')}")

    asyncio.run(main())
