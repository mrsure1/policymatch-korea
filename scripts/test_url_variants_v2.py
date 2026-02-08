
import requests

id = "176066"
urls = [
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn={id}&schM=view",
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-detail.do?pbancSn={id}&schM=view",
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-detail.do?pbancSn={id}",
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn={id}",
    f"https://www.k-startup.go.kr/common/announcement/announcementDetail.do?searchDtlAncmSn={id}" # Another common pattern?
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

print(f"Testing ID: {id}")
for url in urls:
    print(f"\nTesting: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Final URL: {response.url}")
        content_len = len(response.text)
        print(f"Content Length: {content_len}")
        
        if "공고" in response.text and "수요기업" in response.text:
            print("✅ Content found (Keywords matched)")
        elif "목록으로" in response.text:
             print("⚠️ List page detected?")
        else:
             print("⚠️ Content seems missing or generic")
             
    except Exception as e:
        print(f"❌ Error: {e}")
