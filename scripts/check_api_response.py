"""웹앱 API 응답 확인"""
import requests
import json

# API 호출
response = requests.get('http://localhost:3000/api/policies')
data = response.json()

policies = data.get('data', [])

print("=" * 80)
print(f"API 응답: 총 {len(policies)}개 정책")
print("=" * 80)

# K-Startup 링크가 있는 정책 찾기
kstartup_policies = [p for p in policies if p.get('url') and 'k-startup' in p.get('url', '')]

print(f"\nK-Startup URL이 있는 정책: {len(kstartup_policies)}개")

if kstartup_policies:
    print("\n샘플 데이터:")
    for i, p in enumerate(kstartup_policies[:3], 1):
        print(f"\n[{i}] ID: {p.get('id')}")
        print(f"Title: {p.get('title', '')[:70]}...")
        print(f"URL: {p.get('url', 'NULL')[:80]}")
else:
    print("\n⚠️ API 응답에 K-Startup URL이 없습니다!")
    print("\n모든 정책의 url 필드 확인 (처음 5개):")
    for i, p in enumerate(policies[:5], 1):
        print(f"\n[{i}] ID: {p.get('id')}")
        print(f"Title: {p.get('title', '')[:60]}...")
        print(f"URL: {p.get('url') or 'NULL'}")

print("\n" + "=" * 80)
