import requests

header = {'User-Agent': 'Mozilla/5.0'}

# User's Claim: webCMRCZN.do?id=171091 works.
url_user = "https://www.k-startup.go.kr/web/contents/webCMRCZN.do?schM=view&id=171091"
# My Hypothesis: webCMRCZN.do?id=176198 (Scraped ID) works.
url_hypo = "https://www.k-startup.go.kr/web/contents/webCMRCZN.do?schM=view&id=176198"

# Test User URL
try:
    r = requests.get(url_user, headers=header, timeout=10)
    print(f"[User: 171091] Status: {r.status_code}")
    if "사업개요" in r.text or "모집공고" in r.text or "구미시" in r.text:
       print("  -> User URL Valid! Content found.")
    else:
       print("  -> User URL seems empty.")
except Exception as e:
    print(e)
    
# Test Hypothesis URL
try:
    r = requests.get(url_hypo, headers=header, timeout=10)
    print(f"[Hypo: 176198] Status: {r.status_code}")
    if "사업개요" in r.text or "모집공고" in r.text or "구미시" in r.text:
       print("  -> Hypo URL Valid! Content found.")
    else:
       print("  -> Hypo URL seems empty.")
except Exception as e:
    print(e)
