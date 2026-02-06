import asyncio
import json
from playwright.async_api import async_playwright

async def scrape_bizinfo():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        url = "https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do"
        print(f"Navigating to {url}...")
        await page.goto(url)
        
        # Wait for the list to load. 
        # Attempting to wait for a table row or known element.
        try:
            await page.wait_for_selector('table tbody tr', timeout=10000)
        except Exception:
            print("Timeout waiting for table. Dumping page text for debug:")
            print(await page.inner_text('body'))
            await browser.close()
            return

        # Extract data
        results = await page.evaluate('''() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows.map(tr => {
                // Try specific selectors common in gov sites, fall back to generic 'a' tag
                const titleEl = tr.querySelector('td.txt_l a') || tr.querySelector('td.subject a') || tr.querySelector('td:nth-child(2) a');
                
                if (!titleEl) return null;
                
                return {
                    title: titleEl.innerText.trim(),
                    link: titleEl.href,
                    source_site: 'BIZINFO'
                };
            }).filter(item => item !== null);
        }''')
        
        print(f"Found {len(results)} items.")
        
        # Save to JSON
        with open('bizinfo_policies.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
        print("Saved to bizinfo_policies.json")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape_bizinfo())
