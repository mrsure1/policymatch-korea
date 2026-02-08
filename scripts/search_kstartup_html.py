
import re

html_path = 'kstartup_source.html'

try:
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"Loaded {len(content)} bytes from {html_path}")

    # 1. Search for go_view definition
    print("\n--- Searching for 'go_view' definition ---")
    matches = re.finditer(r'function\s+go_view\s*\(', content)
    found_def = False
    for match in matches:
        found_def = True
        start = max(0, match.start())
        # Find closing brace (simple approximation)
        try:
            end = content.find('}', start) + 1
            # Expand to show a bit more context if needed
            print(content[start:end+200])
        except:
            print(content[start:start+500])
            
    if not found_def:
        print("❌ 'function go_view' not found (might be assigned to variable or inside other function)")

    # 2. Search for <form> tags
    print("\n--- Searching for <form> tags ---")
    form_matches = re.finditer(r'<form', content)
    for match in form_matches:
        start = match.start()
        end = content.find('>', start) + 1
        print(content[start:end])

except Exception as e:
    print(f"Error: {e}")
