
"""
Fix K-Startup Links: Use Search URL Strategy (Robust)
Replaces direct links with Search Pattern links to avoid blank page issues.
"""
import sys
import urllib.parse
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

def fix_to_search_url():
    print("="*60)
    print("Converting K-Startup links to Search Pattern...")
    print("="*60)
    
    client = SupabaseClient()
    
    # 1. Fetch ALL K-Startup policies
    result = client.client.table('policy_funds') \
        .select('id, title, url, link') \
        .eq('source_site', 'K-STARTUP') \
        .execute()
        
    policies = result.data
    print(f"Found {len(policies)} K-Startup policies.")
    
    fixed_count = 0
    base_url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
    
    for p in policies:
        title = p['title']
        encoded_title = urllib.parse.quote(title)
        search_url = f"{base_url}?schM=list&schStr={encoded_title}"
        
        updates = {}
        
        # Always update if it's not already the search URL
        if p.get('url') != search_url:
            updates['url'] = search_url
            
        if p.get('link') != search_url:
            updates['link'] = search_url
            
        if updates:
            try:
                client.client.table('policy_funds') \
                    .update(updates) \
                    .eq('id', p['id']) \
                    .execute()
                # print(f"✅ Fixed ID {p['id']}: {title[:30]}...")
                fixed_count += 1
            except Exception as e:
                print(f"❌ Failed to fix ID {p['id']}: {e}")
                
    print(f"\nTotal fixed: {fixed_count}/{len(policies)}")
    print("All K-Startup links now point to a keyword search result for reliability.")

if __name__ == "__main__":
    fix_to_search_url()
