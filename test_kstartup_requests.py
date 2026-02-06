import requests
from bs4 import BeautifulSoup
import json

def scrape_kstartup_requests():
    """Scrape K-Startup using requests + BeautifulSoup."""
    url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
    
    print(f"Fetching {url}...")
    
    # Add headers to mimic a real browser
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"Response status: {response.status_code}")
        print(f"Content length: {len(response.text)} bytes")
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Save HTML for inspection
        with open('kstartup_requests_page.html', 'w', encoding='utf-8') as f:
            f.write(soup.prettify())
        print("Saved HTML to kstartup_requests_page.html")
        
        # Try different selectors to find announcement list
        results = []
        
        # Look for common patterns
        # 1. Links in list items
        list_items = soup.select('li')
        print(f"\nFound {len(list_items)} list items")
        
        for li in list_items[:5]:  # Check first 5
            links = li.find_all('a', href=True)
            for link in links:
                href = link.get('href', '')
                text = link.get_text(strip=True)
                print(f"  - Text: {text[:50]}... | Href: {href[:100]}...")
        
        # 2. Look for specific patterns in links
        all_links = soup.find_all('a', href=True)
        print(f"\nTotal links found: {len(all_links)}")
        
        for link in all_links:
            href = link['href']
            text = link.get_text(strip=True)
            
            # Check if this looks like an announcement link
            if ('bizpbanc-detail' in href or 'pbancSn' in href or 'go_view' in str(link)) and len(text) > 10:
                # Build full URL if relative
                if href.startswith('/'):
                    href = 'https://www.k-startup.go.kr' + href
                elif not href.startswith('http'):
                    href = 'https://www.k-startup.go.kr/web/contents/' + href
                
                results.append({
                    'title': text,
                    'link': href,
                    'source_site': 'K-STARTUP'
                })
        
        # Remove duplicates
        unique_results = []
        seen_titles = set()
        for item in results:
            if item['title'] not in seen_titles:
                seen_titles.add(item['title'])
                unique_results.append(item)
        
        print(f"\nFound {len(unique_results)} unique announcements")
        
        if unique_results:
            # Save results
            with open('kstartup_results_requests.json', 'w', encoding='utf-8') as f:
                json.dump(unique_results, f, ensure_ascii=False, indent=2)
            print("Saved results to kstartup_results_requests.json")
            
            # Print first few
            print("\nFirst 3 results:")
            for i, item in enumerate(unique_results[:3], 1):
                print(f"{i}. {item['title']}")
                print(f"   {item['link']}\n")
        
        return unique_results
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    results = scrape_kstartup_requests()
    print(f"\n=== Final count: {len(results)} items ===")
