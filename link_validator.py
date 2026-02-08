import requests
import urllib.parse
import time

def validate_kstartup_link(url):
    """
    Validates a K-Startup detail URL by fetching it and checking for specific content keywords.
    Returns True if valid, False if invalid (empty/error).
    """
    # Key terms that should appear in a valid policy detail page
    param_keywords = ["신청기간", "지원내용", "문의처", "담당자", "첨부파일", "사업개요"]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        # Slight delay to be polite
        time.sleep(0.1)
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code != 200:
            return False
            
        html = response.text
        
        # Check if any of the keywords are present
        for keyword in param_keywords:
            if keyword in html:
                return True
                
        return False
        
    except Exception as e:
        print(f"Link validation error: {e}")
        return False

def get_safe_kstartup_link(title, original_url):
    """
    Checks the original URL. If valid, returns it.
    If invalid, returns a fallback Search URL based on the title.
    """
    # 1. Validate Original
    if validate_kstartup_link(original_url):
        return original_url
        
    # 2. Fallback to Search
    print(f"  [Link Integrity] Invalid link detected for '{title}'. Switching to Search URL.")
    encoded_title = urllib.parse.quote(title)
    return f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schStr={encoded_title}"
