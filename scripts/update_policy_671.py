"""
특정 정책(ID 671)의 요약정보를 직접 추출하여 DB 업데이트
"""

import requests
from bs4 import BeautifulSoup
import sys
from pathlib import Path
import re
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

# 타겟 정책 ID
POLICY_ID = '671'

print("=" * 80)
print(f"정책 ID {POLICY_ID}의 요약정보 추출")
print("=" * 80)

# 1. 정책 정보 조회
print(f"\n[Step 1] 정책 조회...")
result = supabase.table('policy_funds') \
    .select('id, title, url, raw_content') \
    .eq('id', POLICY_ID) \
    .execute()

if not result.data or len(result.data) == 0:
    print(f"[ERROR] 정책 ID {POLICY_ID}를 찾을 수 없습니다")
    sys.exit(1)

policy = result.data[0]
print(f"[OK] 정책 발견:")
print(f"  제목: {policy['title']}")
print(f"  URL: {policy.get('url', 'N/A')}")
print(f"  기존 raw_content: {'있음' if policy.get('raw_content') else '없음'}")

url = policy.get('url')
if not url or url == 'null':
    print("[ERROR] URL이 없습니다")
    sys.exit(1)

# 2. HTML 크롤링
print(f"\n[Step 2] HTML 크롤링...")
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

try:
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    response.encoding = 'utf-8'
    print(f"[OK] HTTP 200 ({len(response.text)} bytes)")
except Exception as e:
    print(f"[ERROR] 크롤링 실패: {e}")
    sys.exit(1)

# 3. 요약 추출
print(f"\n[Step 3] 요약 추출...")
soup = BeautifulSoup(response.text, 'html.parser')

box_inner = soup.find('div', class_='box_inner')
if not box_inner:
    print("[ERROR] div.box_inner를 찾을 수 없습니다")
    sys.exit(1)

p_txt = box_inner.find('p', class_='txt')
if not p_txt:
    print("[ERROR] p.txt를 찾을 수 없습니다")
    sys.exit(1)

text = p_txt.get_text(separator=' ', strip=True)
text = re.sub(r'\s*다음과\s*같이\s*$', '', text).strip()

print(f"[OK] 요약 추출 성공:")
print(f"  길이: {len(text)} 자")
print(f"  내용: {text[:200]}...")

# 4. DB 업데이트
print(f"\n[Step 4] DB 업데이트...")
try:
    update_result = supabase.table('policy_funds') \
        .update({'raw_content': text}) \
        .eq('id', POLICY_ID) \
        .execute()
    
    if update_result.data:
        print(f"[OK] DB 업데이트 성공!")
    else:
        print(f"[ERROR] DB 업데이트 실패")
except Exception as e:
    print(f"[ERROR] DB 업데이트 오류: {e}")
    sys.exit(1)

print("\n" + "=" * 80)
print("[완료]")
print("=" * 80)
