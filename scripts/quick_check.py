from lib.db.supabase_client import SupabaseClient
client = SupabaseClient()
result = client.client.table('policy_funds').select('id, title, url').like('link', '%k-startup%').limit(3).execute()
print('K-Startup 정책 url 확인:')
for p in result.data:
    print(f"\nID {p['id']}: {p['title'][:60]}...")
    print(f"  url: {p.get('url', 'NULL')}")
