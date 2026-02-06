"""
K-Startup 실제 사이트와 크롤링 데이터 비교
"""
import sys
from pathlib import Path
import requests
from bs4 import BeautifulSoup
import re

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

print("=" * 80)
print("K-Startup 실제 공고 ID 확인")
print("=" * 80)

# 1. 실제 K-Startup 사이트에서 현재 공고 ID 확인
print("\n[1] 실제 K-Startup 사이트에서 공고 ID 수집...")
url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(url, headers=headers, timeout=30)
soup = BeautifulSoup(response.text, 'html.parser')

real_ids = []
all_links = soup.find_all('a', href=True)

for link in all_links:
    onclick = link.get('onclick', '')
    text = link.get_text(strip=True)
    
    if 'go_view' in onclick:
        match = re.search(r'go_view\((\d+)\)', onclick)
        if match and len(text) > 10:
            pbanc_id = match.group(1)
            real_ids.append({
                'id': pbanc_id,
                'title': text[:80]
            })

print(f"✅ 실제 사이트에서 {len(real_ids)}개 공고 발견")
if real_ids[:5]:
    print("\n샘플 (최근 5개):")
    for i, item in enumerate(real_ids[:5], 1):
        print(f"  {i}. ID: {item['id']} - {item['title']}...")

# 2. DB에 저장된 K-Startup 공고 ID 확인
print(f"\n[2] DB에 저장된 K-Startup 공고 ID 확인...")
client = SupabaseClient()
result = client.client.table('policy_funds').select('id, title, link').like('link', '%k-startup%').execute()

db_ids = []
for p in result.data:
    link = p.get('link', '')
    match = re.search(r'pbancSn=(\d+)', link)
    if match:
        db_ids.append({
            'db_id': p['id'],
            'pbanc_sn': match.group(1),
            'title': p['title'][:80]
        })

print(f"✅ DB에 {len(db_ids)}개 K-Startup 공고 저장됨")
if db_ids[:5]:
    print("\n샘플 (첫 5개):")
    for i, item in enumerate(db_ids[:5], 1):
        print(f"  {i}. pbancSn: {item['pbanc_sn']} - {item['title']}...")

# 3. 비교
print(f"\n[3] ID 유효성 비교...")
real_id_set = set(item['id'] for item in real_ids)
db_id_set = set(item['pbanc_sn'] for item in db_ids)

valid_count = len(db_id_set & real_id_set)
invalid_count = len(db_id_set - real_id_set)

print(f"  유효한 ID: {valid_count}개")
print(f"  만료된 ID: {invalid_count}개")

if invalid_count > 0:
    print(f"\n⚠️  만료된 공고 ID (최대 10개):")
    invalid_ids = list(db_id_set - real_id_set)[:10]
    for inv_id in invalid_ids:
        matching = [item for item in db_ids if item['pbanc_sn'] == inv_id]
        if matching:
            print(f"    - pbancSn={inv_id}: {matching[0]['title']}...")

print("\n" + "=" * 80)
print("결론:")
if invalid_count > 0:
    print(f"❌ DB에 저장된 공고 중 {invalid_count}개가 K-Startup 사이트에서 삭제됨")
    print("   → 재크롤링 필요")
else:
    print("✅ 모든 공고 ID가 유효함")
print("=" * 80)
