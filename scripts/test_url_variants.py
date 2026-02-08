
import requests

id = "176066"
urls = [
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn={id}&schM=view",
    f"https://www.k-startup.go.kr/web/contents/bizpbanc-detail.do?pbancSn={id}&schM=view"
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

print(f"Testing ID: {id}")
for url in urls:
    print(f"\nTesting: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Final URL: {response.url}")
        if "공고" in response.text and "수요기업" in response.text: # Check for content
            print("✅ Content found (Keywords matched)")
        else:
             print("⚠️ Content seems missing or generic")
        print(f"Page Title/Heading snippet: {response.text[:200].replace(chr(10), ' ')}")
    except Exception as e:
        print(f"❌ Error: {e}")
