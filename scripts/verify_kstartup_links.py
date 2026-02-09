"""K-Startup 링크 실제 확인"""
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient
import requests
import time

client = SupabaseClient()

# K-Startup 링크가 있는 정책 조회
result = client.client.table('policy_funds').select('id, title, link, url').like('link', '%k-startup%').limit(5).execute()

print("=" * 80)
print("K-Startup 정책 링크 검증")
print("=" * 80)

for i, p in enumerate(result.data, 1):
    print(f"\n[{i}] ID: {p['id']}")
    print(f"Title: {p['title'][:70]}...")
    
    link = p.get('link', '')
    url = p.get('url', '')
    
    print(f"DB link: {link[:80]}")
    print(f"DB url: {url[:80] if url else 'NULL'}")
    
    # 실제 링크 테스트
    test_url = url if url else link
    if test_url.startswith("http://"):
        test_url = test_url.replace("http://", "https://", 1)
    if test_url:
        try:
            response = requests.get(
                test_url,
                timeout=10,
                allow_redirects=True,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36"
                },
            )
            print(f"HTTP Status: {response.status_code}")
            print(f"Final URL: {response.url}")
            
            if response.status_code == 200:
                # 페이지 내용에 공고 번호가 있는지 확인
                if 'schStr=' in response.url:
                     if 'pbancSn' in response.text or 'viewDetail' in response.text or '조회' in response.text:
                         print("✅ 검색 링크 작동 - 목록에 결과 표시됨")
                     else:
                         print("⚠️ 검색 결과 없음 또는 페이지 문제")
                elif 'pbancSn' in response.url or '공고' in response.text[:1000]:
                    print("✅ 링크 작동 - 공고 페이지로 연결됨")
                else:
                    print("⚠️ 페이지는 열리지만 공고 내용 확인 불가")
            else:
                print(f"❌ 링크 오류 - Status {response.status_code}")
        except Exception as e:
            print(f"❌ 링크 접근 실패: {e}")
    time.sleep(1.5)

print("\n" + "=" * 80)
