import requests
import urllib.parse

header = {'User-Agent': 'Mozilla/5.0'}
title = "2026년 구미시 New Venture 창업지원사업 참여기업 모집"
encoded_title = urllib.parse.quote(title)
url_search = f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schStr={encoded_title}"

print(f"Testing Search URL: {url_search}")
try:
    r = requests.get(url_search, headers=header, timeout=10)
    print(f"Status: {r.status_code}")
    if "176198" in r.text or "구미시" in r.text:
       print("  -> Search Page contains the item!")
       # Check if it renders the button
       if "go_view_blank" in r.text:
           print("  -> Contains go_view_blank button.")
    else:
       print("  -> Item NOT found in search results.")
except Exception as e:
    print(e)
