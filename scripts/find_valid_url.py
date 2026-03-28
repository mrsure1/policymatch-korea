"""
유효한 URL을 가진 K-Startup 정책 찾기
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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("=" * 80)
    print("K-Startup 정책 URL 확인 (link vs url)")
    print("=" * 80)
    
    result = supabase.table('policy_funds') \
        .select('id, title, url, link') \
        .eq('source_site', 'K-Startup') \
        .limit(10) \
        .execute()
        
    policies = result.data if result.data else []
    
    if not policies:
        print("  [WARN] K-Startup 정책이 없습니다.")
        return

    print(f"  [OK] {len(policies)}개 정책 발견:")
    for p in policies:
        print(f"    - ID: {p['id']}, Title: {p['title']}")
        print(f"      URL: {p['url']}")
        print(f"      LINK: {p['link']}")

if __name__ == "__main__":
    find_valid_url()
