"""
K-Startup API 직접 호출 시도
"""
import requests
import json

# K-Startup의 실제 API 엔드포인트를 찾아야 함
# 브라우저 Network 탭에서 확인 가능

url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"

headers = {
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest'
}

# POST 요청으로 시도
response = requests.post(url, headers=headers, timeout=30)

print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"\nContent preview:\n{response.text[:1000]}")
