"""
K-Startup 크롤링 - 최종 수정 (title 속성 활용)
HTML 소스 구조 분석 결과: 제목이 title 속성에 들어있음
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import urllib.parse

def scrape_kstartup_final():
    """K-Startup 페이지 소스에서 title 속성 기반 파싱"""
    
    print("=" * 80)
    print("[K-STARTUP] title 속성 기반 크롤링")
    print("=" * 80)
    
    url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        html = response.text
        soup = BeautifulSoup(html, 'html.parser')
        
        # go_view가 포함된 모든 요소 찾기 (a 태그 또는 button 태그)
        # href="javascript:go_view(...)" 또는 onclick="go_view(...)"
        targets = soup.find_all(lambda tag: (tag.name == 'a' or tag.name == 'button') and 
                                          ((tag.get('onclick') and 'go_view' in tag.get('onclick')) or 
                                           (tag.get('href') and 'javascript:go_view' in tag.get('href'))))
        
        print(f"발견된 공고 요소: {len(targets)}개")
        
        if targets:
            print(f"첫 번째 요소 HTML 구조 확인:\n{targets[0].prettify()[:500]}...")

        # Pre-scan check for blank type IDs
        blank_ids = set()
        for tag in targets:
            onclick = tag.get('onclick')
            href = tag.get('href')
            script_str = onclick if onclick and 'go_view' in onclick else href
            if script_str and 'go_view_blank' in script_str:
                match = re.search(r'go_view(?:_blank)?\((\d+)\)', script_str)
                if match:
                    blank_ids.add(match.group(1))

        results = []
        seen_ids = set()
        
        for tag in targets:
            onclick = tag.get('onclick')
            href = tag.get('href')
            script_str = onclick if onclick and 'go_view' in onclick else href
            
            # ID 추출
            match = re.search(r'go_view(?:_blank)?\((\d+)\)', script_str)
            if not match:
                continue
                
            pbanc_id = match.group(1)
            is_blank = pbanc_id in blank_ids
            
            if pbanc_id == '176198':
                with open('debug_targets.txt', 'a', encoding='utf-8') as f:
                    f.write(f"Lookup 176198: blank_ids={blank_ids}, is_blank={is_blank}\n")

            if pbanc_id in seen_ids:
                continue
            seen_ids.add(pbanc_id)
            
            # Metadata Extraction
            # tag is the <a> element
            
            # Metadata Extraction
            # tag is the <a> element (usually) or <button> (for new window links)
            
            # Title
            title_elem = tag.select_one('.ann_cont .tit_wrap .tit')
            if title_elem:
                 title = title_elem.get_text(strip=True)
            elif tag.get('title'):
                 title = tag.get('title')
            else:
                 title = tag.get_text(strip=True)
            
            # Metadata
            deadline_elem = tag.select_one('.ann_top .right .txt')
            deadline = deadline_elem.get_text(strip=True).replace('마감일자', '').strip() if deadline_elem else "마감일 미정"
            
            lis = tag.select('.ann_cont ul li')
            category = lis[0].get_text(strip=True) if len(lis) > 0 else "기타"
            agency = lis[1].get_text(strip=True) if len(lis) > 1 else "미정"
            views = lis[2].get_text(strip=True).replace('조회', '').strip() if len(lis) > 2 else "0"
            
            # Title Cleaning
            title = re.sub(r'새창열기|바로가기|새로운게시글', '', title).strip()
            title = re.sub(r'^\[{2,}', '[', title)
            if title.startswith('[') and title.endswith(']'):
                title = title[1:-1].strip()

            # Fix URL with Fallback
            


            if is_blank:
                # go_view_blank Items (External/Special) -> Use Search URL fallback
                encoded_title = urllib.parse.quote(title)
                detail_url = f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schStr={encoded_title}"
            else:
                # Standard Items -> Use ID based URL
                detail_url = f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn={pbanc_id}&schM=view"
            
            summary = f"[{category}] {agency} | 마감: {deadline} | 조회: {views}"
            
            results.append({
                'title': title,
                'link': detail_url,
                'source_site': 'K-STARTUP',
                'agency': agency,
                'applicationPeriod': deadline,
                'summary': summary
            })
        
        print(f"✅ 총 {len(results)}개 공고 추출")
        
        if results:
            print("\n[샘플 3개]")
            for i, p in enumerate(results[:3], 1):
                print(f"{i}. {p['title']}")
                
        return results
        
    except Exception as e:
        print(f"❌ 크롤링 실패: {e}")
        return []

def scrape_bizinfo():
    """BIZINFO 크롤링"""
    
    print("\n" + "=" * 80)
    print("[BIZINFO] 크롤링")
    print("=" * 80)
    
    url = "https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        links = soup.select('a[href*="selectSIIA200Detail"]')
        
        results = []
        for link in links:
            href = link.get('href', '')
            title = link.get_text(strip=True)
            
            if href and title:
                full_url = f"https://www.bizinfo.go.kr{href}" if href.startswith('/') else href
                results.append({
                    'title': title,
                    'link': full_url,
                    'source_site': 'BIZINFO'
                })
        
        print(f"✅ 총 {len(results)}개 공고 추출")
        return results
        
    except Exception as e:
        print(f"❌ 크롤링 실패: {e}")
        return []

def main():
    """메인 함수"""
    print("\n정책 크롤링 시작 (최종 수정 버전)\n")
    
    # K-Startup 크롤링
    kstartup_results = scrape_kstartup_final()
    
    # BIZINFO 크롤링
    bizinfo_results = scrape_bizinfo()
    
    # 결과 합치기
    all_results = kstartup_results + bizinfo_results
    
    print("\n" + "=" * 80)
    print(f"총 {len(all_results)}개 (K: {len(kstartup_results)}, B: {len(bizinfo_results)})")
    
    # JSON 파일로 저장
    with open('policies.json', 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    
    print("✅ policies.json에 저장 완료")

if __name__ == "__main__":
    main()
