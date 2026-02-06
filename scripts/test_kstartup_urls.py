"""
K-Startup 웹사이트에서 실제 URL 패턴 확인
"""

import requests
from bs4 import BeautifulSoup
import re

def test_kstartup_urls():
    """K-Startup 실제 URL 패턴 확인"""
    
    # 1. 목록 페이지에서 실제 링크 구조 확인
    list_url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    print("="*70)
    print("K-Startup URL 패턴 분석")
    print("="*70)
    
    try:
        response = requests.get(list_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 모든 링크 검사
        print("\n[링크 분석]")
        found_patterns = set()
        sample_links = []
        
        for link in soup.find_all('a', href=True):
            href = link.get('href', '')
            onclick = link.get('onclick', '')
            text = link.get_text(strip=True)
            
            # go_view 함수 확인
            if 'go_view' in onclick:
                match = re.search(r'go_view\((\d+)\)', onclick)
                if match:
                    pbanc_id = match.group(1)
                    found_patterns.add(f"go_view({pbanc_id})")
                    
                    if len(sample_links) < 3:
                        sample_links.append({
                            'title': text[:50] if len(text) > 50 else text,
                            'id': pbanc_id,
                            'onclick': onclick
                        })
        
        print(f"\n발견된 go_view 패턴: {len(found_patterns)}개")
        print("\n샘플 링크:")
        for i, link in enumerate(sample_links, 1):
            print(f"{i}. {link['title']}")
            print(f"   ID: {link['id']}")
            print(f"   onclick: {link['onclick'][:80]}...")
        
        # 2. 실제 상세 페이지 테스트
        if sample_links:
            test_id = sample_links[0]['id']
            print(f"\n\n[상세 페이지 URL 테스트]")
            print(f"테스트 ID: {test_id}")
            
            # 여러 URL 패턴 테스트
            url_patterns = [
                f"https://www.k-startup.go.kr/web/contents/bizpbanc-detail.do?pbancSn={test_id}",
                f"https://www.k-startup.go.kr/web/contents/bizpbanc.do?pbancSn={test_id}",
                f"https://www.k-startup.go.kr/web/contents/announcementDetail.do?pbancSn={test_id}",
                f"https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?pbancSn={test_id}",
            ]
            
            for pattern in url_patterns:
                try:
                    r = requests.get(pattern, headers=headers, timeout=10, allow_redirects=True)
                    print(f"\n패턴: {pattern}")
                    print(f"  상태 코드: {r.status_code}")
                    print(f"  최종 URL: {r.url}")
                    
                    if r.status_code == 200:
                        # 페이지에 제목이 있는지 확인
                        soup_detail = BeautifulSoup(r.text, 'html.parser')
                        title_elem = soup_detail.find('h1') or soup_detail.find('h2') or soup_detail.find(class_=re.compile('title|subject'))
                        if title_elem:
                            print(f"  페이지 제목: {title_elem.get_text(strip=True)[:100]}")
                            print(f"  ✅ 올바른 패턴일 가능성 높음!")
                        else:
                            print(f"  ⚠️ 제목 요소를 찾을 수 없음")
                except Exception as e:
                    print(f"\n패턴: {pattern}")
                    print(f"  ❌ 오류: {e}")
        
        print("\n"+"="*70)
        print("분석 완료")
        print("="*70)
        
    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_kstartup_urls()
