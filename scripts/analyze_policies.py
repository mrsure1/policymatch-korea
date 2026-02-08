"""
정책자금 메타데이터 분석 및 DB 업데이트 스크립트

사용법:
    python scripts/analyze_policies.py --all
    python scripts/analyze_policies.py --source api --limit 10
    python scripts/analyze_policies.py --file sample_data.json --no-db
"""

import os
import sys
import json
import argparse
import asyncio
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.ai.gemini_analyzer import GeminiAnalyzer
from lib.parsers.api_parser import parse_sample_data_json, combine_api_data, parse_policy_json
from lib.parsers.hwp_parser import extract_text_from_hwp
from lib.db.supabase_client import SupabaseClient


async def analyze_and_save(
    data_source: str,
    limit: int = None,
    use_db: bool = True,
    output_file: str = None
):
    """
    정책 데이터 분석 및 저장
    
    Args:
        data_source: 데이터 소스 ('api', 'sample', 'all')
        limit: 분석할 최대 개수
        use_db: DB 저장 여부
        output_file: JSON 출력 파일 (DB 미사용 시)
    """
    print("\n" + "="*70)
    print("🚀 정책자금 메타데이터 분석 시작")
    print("="*70 + "\n")
    
    # 1. 데이터 로드
    print("📂 Step 1: 데이터 로드")
    print("-" * 70)
    
    policies = []
    
    # API 데이터 로드
    if data_source in ['api', 'sample', 'all']:
        sample_path = project_root / 'sample_data.json'
        if sample_path.exists():
            policies.extend(parse_sample_data_json(str(sample_path)))
        else:
            print(f"⚠️  {sample_path} 파일이 없습니다.")
            
        # policies.json (크롤링 데이터) 로드
        policies_path = project_root / 'policies.json'
        if policies_path.exists():
            print(f"📂 policies.json 로드 중...")
            scraped_policies = parse_policy_json(str(policies_path))
            policies.extend(scraped_policies)
            print(f"✅ {len(scraped_policies)}개 크롤링 정책 추가됨")
    
    # HWP 파일 로드
    if data_source in ['hwp', 'all']:
        hwp_dir = project_root / 'data' / 'hwp_files'
        if hwp_dir.exists():
            hwp_files = list(hwp_dir.rglob('*.hwp'))
            print(f"📄 {len(hwp_files)}개 HWP 파일 발견")
            
            for hwp_file in hwp_files:
                result = extract_text_from_hwp(str(hwp_file))
                if result['success']:
                    # HWP는 링크 없음 (None)
                    policies.append((result['title'], result['content'], None))
                    print(f"  ✅ {hwp_file.name}")
                else:
                    print(f"  ❌ {hwp_file.name}: {result['error']}")
        else:
            print(f"⚠️  HWP 디렉토리가 없습니다: {hwp_dir}")
    
    if not policies:
        print("❌ 분석할 데이터가 없습니다.")
        return
    
    # limit 적용
    if limit:
        policies = policies[:limit]
        print(f"✅ {len(policies)}개 정책 로드 (제한: {limit}개)")
    else:
        print(f"✅ {len(policies)}개 정책 로드")
    
    # 2. 이미 분석된 데이터 필터링 (최적화)
    print("\n🔍 Step 2: 중복 데이터 필터링")
    print("-" * 70)
    
    # 정책 링크 맵 생성 (Title -> Link)
    title_to_link = {p[0]: p[2] for p in policies if len(p) > 2}
    
    if use_db:
        try:
            db_client = SupabaseClient()
            existing_titles = set(db_client.get_existing_titles())
            
            new_policies = []
            for p in policies:
                # policies 리스트의 각 항목은 (title, content, link)
                title = p[0]
                if title not in existing_titles:
                    new_policies.append(p)
            
            print(f"   총 {len(policies)}개 중 {len(existing_titles)}개 이미 분석됨")
            print(f"   => 분석 대상: {len(new_policies)}개")
            
            policies = new_policies
            
        except Exception as e:
            print(f"⚠️  중복 확인 실패 (전체 분석 진행): {e}")

    if not policies:
        print("\n✅ 모든 정책이 이미 분석되어 있습니다. 종료합니다.")
        return

    # 3. Gemini 분석
    print("\n📊 Step 3: Gemini AI 분석")
    print("-" * 70)
    
    # 분석기에는 (title, content)만 전달
    policies_for_analysis = [(p[0], p[1]) for p in policies]
    
    try:
        analyzer = GeminiAnalyzer()
        results = await analyzer.analyze_batch(policies_for_analysis)
    except Exception as e:
        print(f"❌ 분석 실패: {e}")
        return
    
    # 결과에 원본 링크 병합
    for result in results:
        if result['success']:
            title = result.get('title', '')
            if title in title_to_link:
                result['link'] = title_to_link[title]
    
    # 3. 결과 저장
    print("\n💾 Step 3: 결과 저장")
    print("-" * 70)
    
    if use_db:
        # Supabase DB에 저장
        try:
            db_client = SupabaseClient()
            
            saved_count = 0
            for i, result in enumerate(results):
                if not result['success']:
                    print(f"⚠️  {i+1}. {result.get('title', 'N/A')}: 분석 실패 - 건너뜀")
                    continue
                
                title = result.get('title', '')
                link = title_to_link.get(title)
                
                # DB 데이터 구조
                policy_data = {
                    'title': title,
                    'link': link,  # 링크 추가
                    'content_summary': result.get('summary'),
                    'region': result.get('region'),
                    'biz_age': result.get('biz_age'),
                    'industry': result.get('industry'),
                    'target_group': result.get('target_group'),
                    'support_type': result.get('support_type'),
                    'amount': result.get('amount'),
                    'source_site': 'GOV24_API'
                }
                
                if db_client.upsert_policy(policy_data):
                    saved_count += 1
                    print(f"✅ {i+1}. {policy_data['title'][:50]}... → DB 저장 완료")
                else:
                    print(f"❌ {i+1}. {policy_data['title'][:50]}... → DB 저장 실패")
            
            print(f"\n✅ DB 저장 완료: {saved_count}/{len(results)}개")
            
        except Exception as e:
            print(f"❌ DB 연결 실패: {e}")
            print("💡 JSON 파일로 저장합니다...")
            use_db = False
    
    if not use_db:
        # JSON 파일로 저장
        output_path = output_file or 'analyzed_policies.json'
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"✅ JSON 저장 완료: {output_path}")
        
        # 통계 출력
        success_count = sum(1 for r in results if r['success'])
        print(f"   성공: {success_count}/{len(results)}개")
    
    # 4. 요약 통계
    print("\n" + "="*70)
    print("📈 분석 결과 요약")
    print("="*70)
    
    # 지역별 통계
    regions = {}
    for r in results:
        if r['success'] and r.get('region'):
            regions[r['region']] = regions.get(r['region'], 0) + 1
    
    print("\n🗺️  지역별 분포:")
    for region, count in sorted(regions.items(), key=lambda x: -x[1])[:10]:
        print(f"   {region}: {count}개")
    
    # 업종별 통계
    industries = {}
    for r in results:
        if r['success'] and r.get('industry'):
            industries[r['industry']] = industries.get(r['industry'], 0) + 1
    
    print("\n🏭 업종별 분포:")
    for industry, count in sorted(industries.items(), key=lambda x: -x[1])[:10]:
        print(f"   {industry}: {count}개")
    
    print("\n" + "="*70)
    print("✅ 분석 완료!")
    print("="*70 + "\n")


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(
        description='정책자금 메타데이터 분석 및 DB 업데이트'
    )
    
    parser.add_argument(
        '--source',
        choices=['api', 'sample', 'hwp', 'all'],
        default='sample',
        help='데이터 소스 선택 (api: API 데이터, hwp: HWP 파일, all: 전체)'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        help='분석할 최대 개수 (예: 10)'
    )
    
    parser.add_argument(
        '--no-db',
        action='store_true',
        help='DB 저장 건너뛰고 JSON으로만 저장'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        help='출력 JSON 파일 경로 (--no-db 사용 시)'
    )
    
    parser.add_argument(
        '--all',
        action='store_true',
        help='모든 데이터 분석 (--source all과 동일)'
    )
    
    args = parser.parse_args()
    
    # --all 플래그 처리
    if args.all:
        args.source = 'all'
    
    # 비동기 실행
    asyncio.run(analyze_and_save(
        data_source=args.source,
        limit=args.limit,
        use_db=not args.no_db,
        output_file=args.output
    ))


if __name__ == "__main__":
    main()
