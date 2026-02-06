"""DB에 있는 실제 데이터 확인"""
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

client = SupabaseClient()

# 모든 정책 조회
result = client.client.table('policy_funds').select('id, title, link, url, source_site').limit(15).execute()

print("=" * 80)
print("DB에 저장된 정책 데이터 (상위 15개)")
print("=" * 80)

for p in result.data:
    source = p.get('source_site') or 'NULL'
    url = p.get('url') or 'NULL'
    link = p.get('link', '')[:50] if p.get('link') else 'NULL'
    
    print(f"\nID: {p['id']}")
    print(f"  Title: {p['title'][:60]}...")
    print(f"  source_site: [{source}]")
    print(f"  url: [{url}]")
    print(f"  link: [{link}]")
