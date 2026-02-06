import requests

url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn=176198&schM=view"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print(f"Fetching {url}...")
try:
    response = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {response.status_code}")
    with open('debug_redirect_response.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    print("Saved response to debug_redirect_response.html")
except Exception as e:
    print(f"Error: {e}")
