import sys
from bs4 import BeautifulSoup
import os

file_path = 'kstartup_source.html'
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    sys.exit(1)

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

print("Searching for go_view links...")
# Find ANY tag with onclick containing go_view
targets = soup.find_all(onclick=lambda x: x and 'go_view' in x)

print(f"Found {len(targets)} elements with go_view.")

for i, tag in enumerate(targets[:3], 1):
    print(f"\n--- Element {i} ({tag.name}) ---")
    print(f"Onclick: {tag.get('onclick')}")
    print("Structure:")
    print(tag.prettify()[:1000])
    
    # Try to find title candidate
    print("Possible Title Candidates:")
    # Check immediate text
    if tag.string:
        print(f"  Direct text: {tag.string.strip()}")
    
    # Check children text
    for child in tag.descendants:
        if child.name is None: # NavigableString
            text = child.strip()
            if len(text) > 5:
                # Parent info
                parent = child.parent.name
                p_class = child.parent.get('class')
                print(f"  {parent} (class={p_class}): {text}")
