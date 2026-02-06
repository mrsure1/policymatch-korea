import asyncio
from playwright.async_api import async_playwright

async def debug_kstartup():
    """Debug K-Startup page structure."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
        print(f"Navigating to {url}...")
        await page.goto(url, wait_until='networkidle')
        
        # Wait a bit for dynamic content
        await page.wait_for_timeout(3000)
        
        # Take a screenshot
        await page.screenshot(path='kstartup_debug.png', full_page=True)
        print("Screenshot saved to kstartup_debug.png")
        
        # Get the HTML
        html = await page.content()
        with open('kstartup_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print("HTML saved to kstartup_page.html")
        
        # Try to find any links
        links = await page.evaluate('''() => {
            const allLinks = Array.from(document.querySelectorAll('a'));
            return allLinks.slice(0, 10).map(a => ({
                text: a.innerText.trim().substring(0, 100),
                href: a.href,
                onclick: a.getAttribute('onclick')
            }));
        }''')
        
        print("\nFirst 10 links found:")
        for i, link in enumerate(links, 1):
            print(f"{i}. Text: {link['text'][:50]}...")
            print(f"   Href: {link['href']}")
            print(f"   Onclick: {link['onclick']}")
            print()
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_kstartup())
