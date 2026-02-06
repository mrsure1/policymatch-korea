"""
Supabase RLS 정책 재확인 및 수정
"""
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

print("=" * 80)
print("Supabase RLS 정책 확인")
print("=" * 80)

client = SupabaseClient()

# 테스트 데이터로 INSERT 시도
test_policy = {
    'title': 'RLS 테스트 정책',
    'content_summary': '테스트',
    'amount': '테스트',
    'source_site': 'TEST'
}

print("\n[테스트] policy_funds 테이블에 INSERT 시도...")
try:
    result = client.client.table('policy_funds').insert(test_policy).execute()
    print("✅ INSERT 성공! RLS 정책이 올바르게 설정됨")
    
    # 테스트 데이터 삭제
    client.client.table('policy_funds').delete().eq('source_site', 'TEST').execute()
    print("✅ 테스트 데이터 삭제 완료")
    
except Exception as e:
    print(f"❌ INSERT 실패: {e}")
    print("\n" + "=" * 80)
    print("해결 방법:")
    print("=" * 80)
    print("\n1. Supabase Dashboard 접속:")
    print("   https://supabase.com/dashboard/project/kjsauyubrwcdrkpivjbk")
    print("\n2. Authentication > Policies 메뉴 선택")
    print("\n3. policy_funds 테이블에 INSERT 정책 추가:")
    print("   - Policy name: Allow public insert")
    print("   - Allowed operation: INSERT")
    print("   - Target roles: authenticated, anon")
    print("   - USING expression: true")
    print("   - WITH CHECK expression: true")
    print("\n또는 SQL Editor에서 실행:")
    print("""
CREATE POLICY "Allow public insert" ON "public"."policy_funds"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);
    """)
    print("=" * 80)
