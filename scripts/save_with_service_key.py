"""
Supabase Service Role Key를 사용하여 RLS 우회
"""
import os
import json
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

project_root = Path(__file__).parent.parent

print("=" * 80)
print("Service Role Key로 DB 저장 시도")
print("=" * 80)

# Service Role Key 확인
service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
url = os.getenv('SUPABASE_URL')

if not service_role_key:
    print("\n❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다!")
    print("\n.env 파일에 다음을 추가하세요:")
    print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
    print("\nService Role Key는 Supabase Dashboard > Settings > API 에서 확인 가능합니다.")
    exit(1)

# Service Role Key로 클라이언트 생성 (RLS 우회)
client = create_client(url, service_role_key)

# policies.json 로드
policies_file = project_root / 'policies.json'
if not policies_file.exists():
    print(f"❌ {policies_file} 파일이 없습니다!")
    exit(1)

with open(policies_file, 'r', encoding='utf-8') as f:
    policies = json.load(f)

print(f"\n✅ {len(policies)}개 정책 로드됨")

# DB에 저장
success_count = 0
error_count = 0

print(f"\n[Service Role Key로 DB 저장 시작]")
for i, policy in enumerate(policies, 1):
    try:
        policy_data = {
            'title': policy.get('title', ''),
            'link': policy.get('link', ''),
            'source_site': policy.get('source_site', ''),
            'content_summary': policy.get('title', '')[:200],
        }
        
        # Service Role Key는 RLS를 우회하므로 직접 insert 가능
        result = client.table('policy_funds') \
            .upsert(policy_data, on_conflict='title') \
            .execute()
        
        success_count += 1
        print(f"  [{i}/{len(policies)}] ✅ {policy.get('title', '')[:60]}...")
        
    except Exception as e:
        error_count += 1
        print(f"  [{i}/{len(policies)}] ❌ 오류: {e}")
        if error_count >= 5:
            print("\n연속 5회 오류 발생. 중단합니다.")
            break

print(f"\n" + "=" * 80)
print(f"[결과] 성공: {success_count}개, 실패: {error_count}개")
print("=" * 80)
