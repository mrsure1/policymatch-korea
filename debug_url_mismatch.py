import requests

header = {'User-Agent': 'Mozilla/5.0'}

# 1. Test generated URL for Guimisi (176198)
url_gen_198 = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn=176198&schM=view"
try:
    r = requests.get(url_gen_198, headers=header, timeout=10)
    print(f"[176198 Gen] Status: {r.status_code}, Length: {len(r.text)}")
    if "사업개요" in r.text or "모집공고" in r.text:
        print("  -> Seems valid (content found)")
    else:
        print("  -> Probably empty/invalid")
except Exception as e:
    print(f"  -> Error: {e}")

# 2. Test generated URL for Seodaemun (176202) -> User mentioned 176202 in valid link context?
url_gen_202 = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn=176202&schM=view"
try:
    r = requests.get(url_gen_202, headers=header, timeout=10)
    print(f"[176202 Gen] Status: {r.status_code}, Length: {len(r.text)}")
    if "사업개요" in r.text:
        print("  -> Seems valid")
    else:
        print("  -> Probably empty")
except Exception as e:
    print(f"  -> Error: {e}")

# 3. Check source for the "Real" ID 171091
try:
    with open('temp_kstartup.html', 'r', encoding='utf-8') as f:
        content = f.read()
        if "171091" in content:
            print(f"\n[Search] Found ID 171091 in source!")
            # Show context
            idx = content.find("171091")
            print(content[idx-100:idx+100])
        else:
            print("\n[Search] ID 171091 NOT found in source.")
except Exception as e:
    print(f"Error reading source: {e}")
