"""
크롤링된 정책 데이터를 AI로 분석하고 DB에 저장하는 스크립트
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Windows 콘솔 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.ai.gemini_analyzer import GeminiAnalyzer
from lib.db.supabase_client import SupabaseClient


async def process_policies():
    """크롤링된 정책 분석 및 DB 저장"""
    
    print("\n" + "="*70)
    print("[AI Analysis & DB Save] Policy Metadata Analysis Started")
    print("="*70 + "\n")
    
    # 1. policies.json 로드
    print("[Step 1] Loading Crawled Data")
    print("-" * 70)
    
    policies_file = project_root / 'policies.json'
    
    if not policies_file.exists():
        print(f"[ERROR] File not found: {policies_file}")
        return
    
    with open(policies_file, 'r', encoding='utf-8') as f:
        policies = json.load(f)
    
    print(f"[OK] Loaded {len(policies)} policies")
    
    # 2. 메타데이터가 있는지 확인 (title, link, source_site)
    valid_items = []
    for p in policies:
        if p.get('title') and p.get('link'):
            valid_items.append(p)
            
    valid_policies_for_ai = [(p['title'], p['link']) for p in valid_items]
    
    print(f"[OK] Analysis target: {len(valid_items)} policies")
    
    # 3. Gemini 분석
    print("\n[Step 2] Gemini AI Metadata Analysis")
    print("-" * 70)
    
    try:
        analyzer = GeminiAnalyzer()
        results = await analyzer.analyze_batch(valid_policies_for_ai)
        print(f"[OK] AI analysis completed: {len(results)} policies")
    except Exception as e:
        print(f"[ERROR] AI analysis failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 4. DB 저장
    print("\n[Step 3] Supabase DB Save")
    print("-" * 70)
    
    try:
        db_client = SupabaseClient()
        
        saved_count = 0
        failed_count = 0
        
        for i, result in enumerate(results):
            if not result.get('success'):
                print(f"[WARN] {i+1}. {result.get('title', 'N/A')[:50]}: Analysis failed - Skipped")
                failed_count += 1
                continue
            
            # 원본 데이터 매칭 (valid_items 사용)
            original = valid_items[i]
            
            # DB 데이터 구조
            policy_data = {
                'title': result.get('title', ''),
                'link': original.get('link', ''),
                'source_site': original.get('source_site', 'UNKNOWN'),
                'content_summary': result.get('summary'),
                'region': result.get('region'),
                'biz_age': result.get('biz_age'),
                'industry': result.get('industry'),
                'target_group': result.get('target_group'),
                'support_type': result.get('support_type'),
                'amount': result.get('amount'),
                # Add ID if available to prevent duplicates or help matching
                'external_id': original.get('id', None) 
            }
            
            # Note: upsert_policy needs to handle external_id if possible, 
            # or we rely on title/link uniqueness.
            
            if db_client.upsert_policy(policy_data):
                saved_count += 1
                print(f"[OK] {i+1}/{len(results)}. {policy_data['title'][:50]}...")
            else:
                failed_count += 1
                print(f"[ERROR] {i+1}/{len(results)}. {policy_data['title'][:50]}... Save failed")
        
        print(f"\n[RESULT] DB Save: {saved_count} success, {failed_count} failed")
        
    except Exception as e:
        print(f"[ERROR] DB operation failed: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 5. 요약 통계
    print("\n" + "="*70)
    print("[Summary] Analysis Results")
    print("="*70)
    
    # 지역별 통계
    regions = {}
    for r in results:
        if r.get('success') and r.get('region'):
            regions[r['region']] = regions.get(r['region'], 0) + 1
    
    if regions:
        print("\n[Region Distribution]")
        for region, count in sorted(regions.items(), key=lambda x: -x[1])[:10]:
            print(f"   {region}: {count}")
    
    # 업종별 통계
    industries = {}
    for r in results:
        if r.get('success') and r.get('industry'):
            industries[r['industry']] = industries.get(r['industry'], 0) + 1
    
    if industries:
        print("\n[Industry Distribution]")
        for industry, count in sorted(industries.items(), key=lambda x: -x[1])[:10]:
            print(f"   {industry}: {count}")
    
    print("\n" + "="*70)
    print("[COMPLETE] All processes finished!")
    print("="*70 + "\n")


if __name__ == "__main__":
    asyncio.run(process_policies())
