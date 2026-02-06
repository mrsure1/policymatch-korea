"""
분석된 정책 데이터를 DB에 저장
"""
import sys
import json
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from lib.db.supabase_client import SupabaseClient

print("=" * 80)
print("Analyzed Policies DB 저장")
print("=" * 80)

# policies.json 파일 로드
policies_file = project_root / 'policies.json'
if not policies_file.exists():
    print(f"❌ {policies_file} 파일이 없습니다!")
    sys.exit(1)

with open(policies_file, 'r', encoding='utf-8') as f:
    policies = json.load(f)

print(f"\n✅ {len(policies)}개 정책 로드됨")

client = SupabaseClient()

success_count = 0
error_count = 0

print(f"\n[DB 저장 시작]")
for i, policy in enumerate(policies, 1):
    try:
        # 기본 필드만 저장 (간단한 버전)
        policy_data = {
            'title': policy.get('title', ''),
            'link': policy.get('link', ''),
            'source_site': policy.get('source_site', ''),
            'content_summary': policy.get('title', '')[:200],  # 제목을 요약으로 사용
        }
        
        # upsert 시도
        result = client.client.table('policy_funds') \
            .upsert(policy_data, on_conflict='title') \
            .execute()
        
        success_count += 1
        print(f"  [{i}/{len(policies)}] ✅ {policy.get('title', '')[:60]}...")
        
    except Exception as e:
        error_count += 1
        print(f"  [{i}/{len(policies)}] ❌ 오류: {e}")
        if error_count >= 3:
            print("\n연속 3회 오류 발생. 중단합니다.")
            break

print(f"\n" + "=" * 80)
print(f"[결과] 성공: {success_count}개, 실패: {error_count}개")
print("=" * 80)
