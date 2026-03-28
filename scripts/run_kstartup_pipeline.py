"""
K-Startup 크롤링 → AI 파싱 → DB 저장 파이프라인

전체 워크플로우:
1. Playwright로 공고 목록 및 상세 본문 수집
2. Gemini API로 roadmap_stage, required_documents_count, required_documents_list 추출
3. Supabase에 upsert
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv

load_dotenv(project_root / ".env.local")
load_dotenv(project_root / ".env")


async def main():
    from lib.scrape.kstartup_crawler import crawl_kstartup_notices
    from lib.ai.gemini_policy_parser import GeminiPolicyParser
    from lib.db.supabase_client import SupabaseClient

    # 1. 크롤링
    print("=" * 60)
    print("1단계: K-Startup 공고 크롤링")
    print("=" * 60)
    notices = await crawl_kstartup_notices(
        headless=True,
        max_list_items=10,
        max_detail_pages=5,
    )

    if not notices:
        print("수집된 공고가 없습니다.")
        return

    # 2. AI 파싱
    print("\n" + "=" * 60)
    print("2단계: Gemini AI 파싱 (roadmap, 서류)")
    print("=" * 60)
    parser = GeminiPolicyParser(request_interval=4.0)

    for n in notices:
        body = n.get("body_html") or ""
        if not body:
            continue
        meta = parser.parse_policy_body(body, title=n.get("title", ""))
        n["roadmap_stage"] = meta.roadmap_stage
        n["required_documents_count"] = meta.required_documents_count
        n["required_documents_list"] = meta.required_documents_list
        print(f"  [{n['notice_id']}] 로드맵 {len(meta.roadmap_stage)}단계, 서류 {meta.required_documents_count}개")

    # 3. DB 저장
    print("\n" + "=" * 60)
    print("3단계: Supabase 저장")
    print("=" * 60)
    client = SupabaseClient()

    for n in notices:
        row = {
            "title": n.get("title", ""),
            "link": n.get("detail_url"),
            "url": n.get("detail_url"),
            "source_site": "K-STARTUP",
            "notice_id": n.get("notice_id"),
            "content_summary": None,
            "raw_content": n.get("body_html"),
            "detail_content": n.get("body_html"),
            "roadmap_stage": n.get("roadmap_stage", []),
            "required_documents_count": n.get("required_documents_count", 0),
            "required_documents_list": n.get("required_documents_list", []),
        }
        try:
            client.upsert_policy(row)
            print(f"  ✓ 저장: {n['title'][:50]}...")
        except Exception as e:
            print(f"  ✗ 실패: {e}")

    print("\n파이프라인 완료.")


if __name__ == "__main__":
    asyncio.run(main())
