"""
잘못된 정책 데이터("현재 페이지" 등) 확인 및 삭제 스크립트
"""

import sys
from pathlib import Path
from supabase import create_client, Client

# Windows 콘솔 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# .env.local 로드
from dotenv import load_dotenv
import os

env_path = project_root / '.env.local'
load_dotenv(env_path)

# Supabase 설정
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] .env.local 파일에서 Supabase 설정을 찾을 수 없습니다!")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_invalid_policies():
    print("=" * 80)
    print("잘못된 정책 데이터 확인 및 삭제")
    print("=" * 80)

    # 1. "현재 페이지" 제목을 가진 정책 조회
    print("\n[Step 1] '현재 페이지' 제목을 가진 정책 조회...")
    
    # '현재 페이지'가 포함된 제목 검색
    result = supabase.table('policy_funds') \
        .select('id, title, created_at') \
        .ilike('title', '%현재 페이지%') \
        .execute()
    
    invalid_policies = result.data if result.data else []
    
    # 추가로 제목이 너무 짧거나 이상한 데이터도 확인
    result2 = supabase.table('policy_funds') \
        .select('id, title, created_at') \
        .ilike('title', '%페이지%') \
        .execute()
        
    for p in (result2.data or []):
        if p not in invalid_policies:
            invalid_policies.append(p)
            
    if not invalid_policies:
        print("  [OK] 잘못된 데이터가 발견되지 않았습니다.")
        return

    print(f"  [WARN] 총 {len(invalid_policies)}개의 의심스러운 데이터 발견:")
    for p in invalid_policies:
        print(f"    - ID: {p['id']}, Title: {p['title']}, Created: {p['created_at']}")
    
    # 2. 삭제 실행
    print("\n[Step 2] 데이터 삭제 실행...")
    ids_to_delete = [p['id'] for p in invalid_policies]
    
    try:
        delete_result = supabase.table('policy_funds') \
            .delete() \
            .in_('id', ids_to_delete) \
            .execute()
            
        print(f"  [OK] {len(ids_to_delete)}개 데이터 삭제 완료")
        
    except Exception as e:
        print(f"  [ERROR] 삭제 중 오류 발생: {e}")

if __name__ == "__main__":
    clean_invalid_policies()
