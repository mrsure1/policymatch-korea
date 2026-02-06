"""
K-Startup HTML 구조 분석
"""
import requests
from bs4 import BeautifulSoup

url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(url, headers=headers, timeout=30)
soup = BeautifulSoup(response.text, 'html.parser')

# go_view를 포함하는 첫 번째 링크 분석
links = soup.find_all('a', onclick=lambda x: x and 'go_view' in x)

print("=" * 80)
print("첫 3개 링크의 HTML 구조 분석")
print("=" * 80)

for i, link in enumerate(links[:3], 1):
    print(f"\n[{i}] onclick: {link.get('onclick')}")
    print(f"    HTML:\n{link.prettify()}")
    print(f"    전체 텍스트: {link.get_text(strip=True)}")
    print(f"    직접 자식들:")
    for child in link.children:
        if child.name:
            print(f"      <{child.name}>: {child.get_text(strip=True)[:80]}")
    print("-" * 80)
