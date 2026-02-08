
import requests
import re

base_url = "https://www.k-startup.go.kr"
js_files = [
    "/cubersc/templete/kstartup1/js/common.js",
    "/cubersc/templete/kstartup1/js/sub.js",
    "/cubersc/templete/common/js/common.js"
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print("Searching for 'go_view' in K-Startup JS files...")

for js_path in js_files:
    url = base_url + js_path
    print(f"\nFetching {url}...")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            content = response.text
            if "go_view" in content:
                print(f"✅ Found 'go_view' in {js_path}!")
                
                # Extract the function definition using regex
                # Look for 'function go_view' or 'go_view = function'
                matches = re.finditer(r'(function\s+go_view\s*\(.*?\)\s*{[\s\S]*?})', content)
                for i, match in enumerate(matches):
                    print(f"\n--- Definition {i+1} ---")
                    # Print first 500 chars of function
                    print(match.group(1)[:1000])
                    print("...\n------------------")
            else:
                print(f"❌ 'go_view' not found in {js_path}")
        else:
            print(f"❌ Failed to fetch {url} (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Error fetching {url}: {e}")
