"""
모든 정책의 url 필드를 link 값으로 업데이트 (source_site 무관)
url이 NULL이고 link가 있는 모든 정책 대상
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient


def fix_all_urls():
    """url이 NULL이고 link가 있는 모든 정책의 url 업데이트"""
    
    print("="*70)
    print("[URL Fix - All Policies] 시작")
    print("="*70)
    
    try:
        client = SupabaseClient()
        
        # 1. url이 NULL이고 link가 있는 모든 정책 조회
        print("\n[Step 1] url이 NULL인 정책 조회...")
        result = client.client.table('policy_funds') \
            .select('id, title, link, url, source_site') \
            .is_('url', 'null') \
            .execute()
        
        all_policies = result.data
        print(f"총 {len(all_policies)}개 정책 발견")
        
        # link가 있는 정책만 필터링
        policies_with_link = [p for p in all_policies if p.get('link')]
        print(f"그 중 link가 있는 정책: {len(policies_with_link)}개")
        
        if not policies_with_link:
            print("\n업데이트할 정책이 없습니다.")
            return
        
        # 2. 각 정책의 url을 link 값으로 업데이트
        print(f"\n[Step 2] {len(policies_with_link)}개 정책의 URL 업데이트 중...")
        updated_count = 0
        error_count = 0
        
        for policy in policies_with_link:
            try:
                # url 필드를 link 값으로 업데이트
                update_result = client.client.table('policy_funds') \
                    .update({'url': policy['link']}) \
                    .eq('id', policy['id']) \
                    .execute()
                
                updated_count += 1
                title_preview = policy['title'][:50] if len(policy['title']) > 50 else policy['title']
                source = policy.get('source_site') or 'NULL'
                print(f"  [{updated_count}/{len(policies_with_link)}] ID {policy['id']} ({source}): {title_preview}...")
                
            except Exception as e:
                error_count += 1
                print(f"  [ERROR] ID {policy['id']}: {e}")
        
        print(f"\n[Result] {updated_count}개 성공, {error_count}개 실패")
        
        # 3. 검증
        print("\n[Step 3] 업데이트 검증...")
        verify_result = client.client.table('policy_funds') \
            .select('id') \
            .is_('url', 'null') \
            .execute()
        
        remaining_null = len([p for p in verify_result.data])
        print(f"url이 NULL인 정책: {remaining_null}개")
        
        # K-Startup 링크가 있는지 확인
        kstartup_check = client.client.table('policy_funds') \
            .select('id, url') \
            .like('link', '%k-startup.go.kr%') \
            .execute()
        
        kstartup_with_url = len([p for p in kstartup_check.data if p.get('url')])
        print(f"K-Startup 링크가 포함된 정책 중 url 있는 것: {kstartup_with_url}개 / {len(kstartup_check.data)}개")
        
        print("\n" + "="*70)
        print("완료!")
        print("="*70)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    fix_all_urls()
