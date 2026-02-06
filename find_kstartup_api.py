import asyncio
import json
from playwright.async_api import async_playwright

async def find_kstartup_api():
    """Monitor network requests to find the actual data endpoint."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # Visible browser to see what's happening
        page = await browser.new_page()
        
        # Store network requests
        requests = []
        responses = []
        
        # Listen to network events
        async def handle_request(request):
            requests.append({
                'url': request.url,
                'method': request.method,
                'headers': dict(request.headers)
            })
        
        async def handle_response(response):
            url = response.url
            # Look for JSON responses or AJAX calls
            if 'ajax' in url.lower() or 'api' in url.lower() or 'list' in url.lower():
                try:
                    content_type = response.headers.get('content-type', '')
                    if 'json' in content_type or 'javascript' in content_type:
                        body = await response.text()
                        responses.append({
                            'url': url,
                            'status': response.status,
                            'content_type': content_type,
                            'body_preview': body[:500]  # First 500 chars
                        })
                        print(f"\n=== Found potential API endpoint ===")
                        print(f"URL: {url}")
                        print(f"Status: {response.status}")
                        print(f"Content-Type: {content_type}")
                        print(f"Body preview: {body[:200]}...")
                except Exception as e:
                    print(f"Error reading response: {e}")
        
        page.on('request', handle_request)
        page.on('response', handle_response)
        
        url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
        print(f"Navigating to {url}...")
        print("Monitoring network requests...\n")
        
        await page.goto(url, wait_until='networkidle')
        
        # Wait a bit more for any lazy-loaded content
        await page.wait_for_timeout(5000)
        
        print(f"\n\n=== Total requests captured: {len(requests)} ===")
        print(f"=== Potential API endpoints found: {len(responses)} ===")
        
        # Save all responses to file for analysis
        with open('kstartup_network_responses.json', 'w', encoding='utf-8') as f:
            json.dump(responses, f, ensure_ascii=False, indent=2)
        
        print("\nSaved detailed responses to kstartup_network_responses.json")
        
        # List all request URLs
        print("\n=== All request URLs ===")
        for i, req in enumerate(requests[:20], 1):  # First 20
            print(f"{i}. {req['method']} {req['url']}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(find_kstartup_api())
