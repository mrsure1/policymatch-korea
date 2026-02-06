"""
Selenium 디버그 - 실제 페이지 표시 확인
"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

# Chrome 옵션 (헤드리스 비활성화 - 실제 브라우저 표시)
chrome_options = Options()
chrome_options.add_argument('--start-maximized')

# WebDriver 초기화
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)

try:
    # K-Startup 페이지 로드
    url = "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do"
    print(f"페이지 로드: {url}")
    driver.get(url)
    
    # 페이지 로딩 대기
    print("5초 대기...")
    time.sleep(5)
    
    # 페이지 소스 일부 출력
    page_source = driver.page_source
    print(f"\n페이지 소스 길이: {len(page_source)} bytes")
    
    # go_view가 있는지 확인
    if 'go_view' in page_source:
        print("✅ 'go_view' 함수 발견")
        import re
        matches = re.findall(r'go_view\((\d+)\)', page_source)
        print(f"   발견된 ID: {len(matches)}개")
        if matches:
            print(f"   샘플 ID: {matches[:5]}")
    else:
        print("❌ 'go_view' 함수를 찾을 수 없음")
    
    # 모든 링크 확인
    all_links = driver.find_elements(By.TAG_NAME, "a")
    print(f"\n전체 링크 수: {len(all_links)}개")
    
    # onclick 속성이 있는 링크
    onclick_links = [link for link in all_links if link.get_attribute('onclick')]
    print(f"onclick 속성이 있는 링크: {len(onclick_links)}개")
    
    # go_view가 포함된 링크
    goview_links = [link for link in onclick_links if 'go_view' in (link.get_attribute('onclick') or '')]
    print(f"go_view 포함 링크: {len(goview_links)}개")
    
    if goview_links:
        print("\n[첫 3개 링크 분석]")
        for i, link in enumerate(goview_links[:3], 1):
            onclick = link.get_attribute('onclick')
            text = link.text[:80]
            print(f"{i}. onclick: {onclick}")
            print(f"   텍스트: {text}...")
            print()
    
    print("\n브라우저가 10초 후 자동으로 닫힙니다...")
    time.sleep(10)
    
finally:
    driver.quit()
    print("✅ 완료")
