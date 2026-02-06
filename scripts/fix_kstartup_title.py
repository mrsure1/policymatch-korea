"""
K-Startup 크롤링 개선 버전
- 제목만 정확히 추출
- 불필요한 텍스트(날짜, 조회수) 제거
"""

import requests
from bs4 import BeautifulSoup
import re
import json

def clean_kstartup_data():
    """K-Startup에서 공고 제목과 ID만 정확히 추출"""
    
    url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    response = requests.get(url, headers=headers, timeout=30)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    results = []
   
    # 모든 go_view 링크 찾기
    all_links = soup.find_all('a', href=True)
    
    for link in all_links:
        onclick = link.get('onclick', '')
        
        if 'go_view' in onclick:
            # ID 추출
            match = re.search(r'go_view\((\d+)\)', onclick)
            if match:
                pbanc_id = match.group(1)
                
                # 링크 전체 텍스트
                full_text = link.get_text(strip=True)
                
                # 제목만 추출 (정규식으로 패턴 제거)
                # 제거할 패턴: D-숫자, 마감일자, 조회 수, 새로운게시글, 카테고리(사업화, 글로벌 등)
                clean_title = full_text
                
                # 패턴 제거
                clean_title = re.sub(r'D-\d+', '', clean_title)  # D-7 제거
                clean_title = re.sub(r'마감일자\s*\d{4}-\d{2}-\d{2}', '', clean_title)  # 마감일자 제거
                clean_title = re.sub(r'조회\s*[\d,]+', '', clean_title)  # 조회 수 제거
                clean_title = re.sub(r'새로운게시글', '', clean_title)  # 새로운게시글 제거
                clean_title = re.sub(r'^(사업화|글로벌|멘토링ㆍ컨설팅ㆍ교육|시설ㆍ공간ㆍ보육|인력)', '', clean_title)  # 카테고리 제거
                clean_title = re.sub(r'\s+', ' ', clean_title).strip()  # 연속 공백 정리
                
                # 제목이 너무 짧지 않은지 확인
                if len(clean_title) > 10:
                    detail_url = f"https://www.k-startup.go.kr/web/contents/bizpbanc-detail.do?pbancSn={pbanc_id}"
                    
                    results.append({
                        'title': clean_title,
                        'link': detail_url,
                        'pbanc_id': pbanc_id,
                        'raw_text': full_text[:100]  # 디버깅용
                    })
    
    # 중복 제거 (제목 기준)
    seen = set()
    unique_results = []
    for item in results:
        if item['title'] not in seen:
            seen.add(item['title'])
            unique_results.append(item)
    
    return unique_results

if __name__ == "__main__":
    print("=" * 80)
    print("K-Startup 데이터 정제 테스트")
    print("=" * 80)
    
    results = clean_kstartup_data()
    
    print(f"\n총 {len(results)}개 공고 추출\n")
    
    for i, item in enumerate(results[:10], 1):
        print(f"[{i}] ID: {item['pbanc_id']}")
        print(f"    제목: {item['title']}")
        print(f"    원본: {item['raw_text']}...")
        print(f"    링크: {item['link']}")
        print()
    
    # 결과 저장
    with open('kstartup_fixed.json', 'w', encoding='utf-8') as f:
        json.dump([{
            'title': item['title'],
            'link': item['link'],
            'source_site': 'K-STARTUP'
        } for item in results], f, ensure_ascii=False, indent=2)
    
    print(f"✅ kstartup_fixed.json에 저장됨")
