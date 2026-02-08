
import requests
import urllib.parse

# Title from policies.json (ID 176066)
title = "초격차 스타트업 프로젝트(DIPS) Link-up(링크업) - 4대 도메인 AX 프로그램 수요기업(기관) 모집공고"
encoded_title = urllib.parse.quote(title)

urls = [
    # Search URL - explicitly setting list mode
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=list&schStr={encoded_title}",
    # Search URL - default (no schM)
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schStr={encoded_title}",
    # Search URL - with explicit page 1
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?page=1&schStr={encoded_title}"
]

headers = {'User-Agent': 'Mozilla/5.0'}

print(f"Testing Search URL for title: {title[:30]}...")

for url in urls:
    print(f"\nTesting: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        
        # Check if the title exists in the response (meaning search worked)
        # We search for a substring of the title to avoid encoding issues or exact match failures
        check_str = title[:20] 
        if check_str in response.text:
            print("✅ Title found in search results!")
        else:
            print("⚠️ Title NOT found (Search might have failed)")
            
        # Check if it found exactly 1 item?
        # Hard to check without parsing, but presence is good enough for now.
        
    except Exception as e:
        print(f"❌ Error: {e}")
