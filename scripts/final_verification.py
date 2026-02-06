"""
웹앱 API와 실제 K-Startup 사이트 비교 검증
"""
import sys
from pathlib import Path
import requests
import re

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

print("=" * 80)
print("최종 검증: 웹앱 API 및 K-Startup 링크 확인")
print("=" * 80)

# 1. DB에서 K-Startup 정책 확인
print("\n[1] DB에 저장된 K-Startup 정책 확인...")
client = SupabaseClient()
result = client.client.table('policy_funds').select('id, title, link').like('link', '%k-startup%').order('id', desc=True).limit(5).execute()

print(f"✅ K-Startup 정책 {len(result.data)}개 발견")

valid_links = []
invalid_links = []

# 2. 각 링크 유효성 검증
print("\n[2] 링크 유효성 검증...")
for p in result.data:
    link = p.get('link', '')
    title = p['title'][:60]
    
    try:
        response = requests.get(link, timeout=10, allow_redirects=True)
        if response.status_code == 200 and ('pbancSn' in response.url or '공고' in response.text[:2000]):
            print(f"  ✅ ID {p['id']}: {title}... [유효]")
            valid_links.append(p)
        else:
            print(f"  ⚠️  ID {p['id']}: {title}... [응답 이상: {response.status_code}]")
            invalid_links.append(p)
    except Exception as e:
        print(f"  ❌ ID {p['id']}: {title}... [접근 실패: {str(e)[:50]}]")
        invalid_links.append(p)

# 3. 웹앱 API 확인
print("\n[3] 웹앱 API 응답 확인...")
try:
    api_response = requests.get('http://localhost:3000/api/policies', timeout=5)
    api_data = api_response.json()
    policies = api_data.get('data', [])
    
    kstartup_in_api = [p for p in policies if 'k-startup' in p.get('url', '').lower()]
    print(f"✅ API에서 K-Startup 정책 {len(kstartup_in_api)}개 반환")
    
    if kstartup_in_api[:2]:
        print("\n샘플:")
        for p in kstartup_in_api[:2]:
            print(f"  - {p.get('title', '')[:50]}...")
            print(f"    URL: {p.get('url', '')[:80]}")
except Exception as e:
    print(f"❌ API 호출 실패: {e}")

print("\n" + "=" * 80)
print("최종 결과:")
print(f"  유효한 링크: {len(valid_links)}개")
print(f"  문제 있는 링크: {len(invalid_links)}개")
if len(valid_links) > 0:
    print("\n✅ K-Startup 링크가 정상적으로 작동합니다!")
    print("   웹앱을 새로고침(Ctrl+Shift+R)하고 테스트해보세요.")
else:
    print("\n⚠️  모든 링크에 문제가 있습니다. 재확인이 필요합니다.")
print("=" * 80)
