"""
K-Startup 목록 페이지 HTML 소스 덤프 및 분석
"""
import requests

url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print(f"Fetching {url}...")
try:
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    
    # HTML 저장
    with open('kstartup_source.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
        
    print(f"Saved {len(response.text)} bytes to kstartup_source.html")
    
    # 간단한 분석
    if 'go_view' in response.text:
        print("Found 'go_view' in source.")
        
        # go_view 주변 텍스트 확인 (샘플)
        import re
        matches = re.finditer(r'go_view\((\d+)\)', response.text)
        count = 0
        for match in matches:
            count += 1
            if count <= 3:
                start = max(0, match.start() - 200)
                end = min(len(response.text), match.end() + 200)
                print(f"\n--- Sample {count} (ID: {match.group(1)}) ---")
                print(response.text[start:end])
    else:
        print("'go_view' NOT found in source.")
        
except Exception as e:
    print(f"Error: {e}")
