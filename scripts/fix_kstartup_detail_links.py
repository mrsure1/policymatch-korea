
"""
Fix K-Startup URLs in DB: ongoing.do -> detail.do
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

def fix_urls():
    print("="*60)
    print("Replacing ongoing.do with detail.do for K-Startup links...")
    print("="*60)
    
    client = SupabaseClient()
    
    # 1. Fetch policies with 'ongoing.do' in link or url
    result = client.client.table('policy_funds') \
        .select('id, title, url, link') \
        .or_('url.ilike.%ongoing.do%,link.ilike.%ongoing.do%') \
        .eq('source_site', 'K-STARTUP') \
        .execute()
        
    policies = result.data
    print(f"Found {len(policies)} policies with 'ongoing.do' URL.")
    
    fixed_count = 0
    
    for p in policies:
        updates = {}
        
        # Check URL
        if p.get('url') and 'bizpbanc-ongoing.do?pbancSn=' in p['url']:
            updates['url'] = p['url'].replace('bizpbanc-ongoing.do', 'bizpbanc-detail.do')
            
        # Check Link
        if p.get('link') and 'bizpbanc-ongoing.do?pbancSn=' in p['link']:
            updates['link'] = p['link'].replace('bizpbanc-ongoing.do', 'bizpbanc-detail.do')
            
        if updates:
            try:
                client.client.table('policy_funds') \
                    .update(updates) \
                    .eq('id', p['id']) \
                    .execute()
                print(f"✅ Fixed ID {p['id']}: {p['title'][:40]}...")
                fixed_count += 1
            except Exception as e:
                print(f"❌ Failed to fix ID {p['id']}: {e}")
                
    print(f"\nTotal fixed: {fixed_count}/{len(policies)}")

if __name__ == "__main__":
    fix_urls()
