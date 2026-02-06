"""
K-Startup 정책의 url 필드를 link 값으로 업데이트
"""

import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient


def fix_kstartup_urls():
    """K-Startup 정책들의 url 필드 업데이트"""
    
    print("="*70)
    print("[K-Startup URL Fix] 시작")
    print("="*70)
    
    try:
        client = SupabaseClient()
        
        # 1. K-Startup 정책 중 url이 NULL인 것 조회
        print("\n[Step 1] K-Startup 정책 조회...")
        result = client.client.table('policy_funds') \
            .select('id, title, link, url') \
            .eq('source_site', 'K-STARTUP') \
            .is_('url', 'null') \
            .execute()
        
        policies = result.data
        print(f"업데이트 대상: {len(policies)}개")
        
        if not policies:
            print("\n이미 모든 K-Startup 정책의 url이 설정되어 있습니다.")
            return
        
        # 2. 각 정책의 url을 link 값으로 업데이트
        print("\n[Step 2] URL 업데이트 중...")
        updated_count = 0
        
        for policy in policies:
            if policy['link']:
                try:
                    # url 필드를 link 값으로 업데이트
                    update_result = client.client.table('policy_funds') \
                        .update({'url': policy['link']}) \
                        .eq('id', policy['id']) \
                        .execute()
                    
                    updated_count += 1
                    title_preview = policy['title'][:50] if len(policy['title']) > 50 else policy['title']
                    print(f"  [{updated_count}/{len(policies)}] {title_preview}...")
                    
                except Exception as e:
                    print(f"  [ERROR] ID {policy['id']}: {e}")
        
        print(f"\n[Result] {updated_count}/{len(policies)}개 업데이트 완료!")
        
        # 3. 검증
        print("\n[Step 3] 업데이트 검증...")
        verify_result = client.client.table('policy_funds') \
            .select('id, title, url') \
            .eq('source_site', 'K-STARTUP') \
            .is_('url', 'null') \
            .execute()
        
        remaining = len(verify_result.data)
        if remaining == 0:
            print("✅ 모든 K-Startup 정책의 url이 설정되었습니다!")
        else:
            print(f"⚠️  여전히 url이 NULL인 정책: {remaining}개")
        
        print("\n" + "="*70)
        print("완료!")
        print("="*70)
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    fix_kstartup_urls()
