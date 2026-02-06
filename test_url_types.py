import requests

url_ongoing = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn=176139&schM=view"
url_detail = "https://www.k-startup.go.kr/web/contents/bizpbanc-detail.do?pbancSn=176139&schM=view"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print(f"Testing ongoing.do: {url_ongoing}")
r1 = requests.get(url_ongoing, headers=headers)
if "사업개요" in r1.text:
    print("SUCCESS: ongoing.do has content")
else:
    print("FAILURE: ongoing.do missing content")

print(f"Testing detail.do: {url_detail}")
r2 = requests.get(url_detail, headers=headers)
if "사업개요" in r2.text:
    print("SUCCESS: detail.do has content")
else:
    print("FAILURE: detail.do missing content")
