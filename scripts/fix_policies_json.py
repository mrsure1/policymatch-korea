
import json
import os

def fix_policies_json():
    json_path = 'policies.json'
    
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return

    print(f"Reading {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    fixed_count = 0
    for item in data:
        link = item.get('link', '')
        if 'k-startup.go.kr' in link and 'schStr=' not in link:
            # Replace with Search URL
            title = item['title']
            import urllib.parse
            encoded_title = urllib.parse.quote(title)
            new_link = f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=list&schStr={encoded_title}"
            item['link'] = new_link
            fixed_count += 1
            
    if fixed_count > 0:
        print(f"Fixed {fixed_count} links.")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Saved to {json_path}")
    else:
        print("No links needed fixing.")

if __name__ == "__main__":
    fix_policies_json()
