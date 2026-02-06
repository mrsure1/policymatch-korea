"""
Supabase RLS 정책 수정 가이드

현재 문제: Row-level security policy 위반으로 데이터 INSERT 실패

해결 방법:
1. Supabase Dashboard에서 RLS 정책 수정
2. 또는 서비스 키를 사용하여 RLS 우회
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

# ANON KEY 대신 SERVICE ROLE KEY 필요
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
anon_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # 서비스 키 필요

print("=" * 70)
print("Supabase RLS 정책 확인")
print("=" * 70)
print(f"\nSupabase URL: {url}")
print(f"ANON KEY: {'설정됨' if anon_key else '없음'}")
print(f"SERVICE KEY: {'설정됨' if service_key else '없음 ⚠️'}")

print("\n" + "=" * 70)
print("해결 방법")
print("=" * 70)

print("""
방법 1: Supabase Dashboard에서 RLS 정책 설정 (권장)
----------------------------------------
1. https://supabase.com/dashboard/project/kjsauyubrwcdrkpivjbk 접속
2. Authentication > Policies 선택
3. policy_funds 테이블에 다음 정책 추가:
   
   ✅ INSERT 정책:
   - Policy name: "Allow public insert"
   - Allowed operation: INSERT
   - Target roles: authenticated, anon
   - USING expression: true
   - WITH CHECK expression: true

방법 2: 서비스 키 사용 (임시 해결)
----------------------------------------
1. Supabase Dashboard > Settings > API 메뉴에서 service_role key 복사
2. .env.local 파일에 다음 추가:
   SUPABASE_SERVICE_ROLE_KEY=<복사한_키>
3. supabase_client.py 수정하여 서비스 키 사용

방법 3: RLS 비활성화 (개발 환경만, 비권장)
----------------------------------------
1. Supabase Dashboard에서 SQL Editor 열기
2. 다음 SQL 실행:
   ALTER TABLE policy_funds DISABLE ROW LEVEL SECURITY;

⚠️ 주의: 방법 3은 보안상 위험하므로 개발 환경에서만 사용하세요!
""")

print("\n추천: 방법 1 (RLS 정책 설정)을 사용하세요.")
print("=" * 70)
