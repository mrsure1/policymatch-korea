"""
K-Startup 공고 상세 페이지에서 요약정보 추출하여 DB 업데이트

div.box_inner 안의 p.txt 내용을 크롤링하고,
끝부분의 "다음과 같이" 문구를 제거하여 raw_content로 저장합니다.
"""

import requests
from bs4 import BeautifulSoup
import sys
from pathlib import Path
import re
from supabase import create_client, Client

# Windows 콘솔 인코딩 문제 해결
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# .env.local 로드
from dotenv import load_dotenv
import os

env_path = project_root / '.env.local'
load_dotenv(env_path)

# Supabase 설정 (.env.local에서 읽기)
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] .env.local 파일에서 Supabase 설정을 찾을 수 없습니다!")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def extract_summary_from_html(html_content: str) -> str:
    """
    HTML에서 div.box_inner 안의 p.txt 내용 추출
    
    Args:
        html_content: HTML 문자열
    
    Returns:
        추출된 요약 텍스트 (끝부분의 "다음과 같이" 제거)
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # div.box_inner 찾기
    box_inner = soup.find('div', class_='box_inner')
    if not box_inner:
        return ""
    
    # p.txt 찾기
    p_txt = box_inner.find('p', class_='txt')
    if not p_txt:
        return ""
    
    # 텍스트 추출 및 정리
    text = p_txt.get_text(separator=' ', strip=True)
    
    # "다음과 같이" 문구 제거 (끝부분)
    text = re.sub(r'\s*다음과\s*같이\s*$', '', text).strip()
    
    return text


def scrape_policy_detail(policy_id: str, url: str) -> str:
    """
    K-Startup 공고 상세 페이지 크롤링
    
    Args:
        policy_id: 정책 ID
        url: 공고 URL
    
    Returns:
        추출된 요약 텍스트
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        print(f"[정책 ID {policy_id}] 크롤링 시작...")
        print(f"  URL: {url}")
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        # 요약 추출
        summary = extract_summary_from_html(response.text)
        
        if summary:
            print(f"  [OK] 요약 추출 성공: {summary[:100]}...")
            return summary
        else:
            print(f"  [WARN] 요약 정보를 찾을 수 없습니다")
            return ""
            
    except Exception as e:
        print(f"  [ERROR] 크롤링 실패: {e}")
        return ""


def update_policy_raw_content(policy_id: str, raw_content: str) -> bool:
    """
    DB의 raw_content 업데이트
    
    Args:
        policy_id: 정책 ID (문자열)
        raw_content: 업데이트할 raw_content
    
    Returns:
        성공 여부
    """
    try:
        result = supabase.table('policy_funds') \
            .update({'raw_content': raw_content}) \
            .eq('id', policy_id) \
            .execute()
        
        if result.data:
            print(f"  [OK] DB 업데이트 성공 (ID: {policy_id})")
            return True
        else:
            print(f"  [ERROR] DB 업데이트 실패 (ID: {policy_id})")
            return False
            
    except Exception as e:
        print(f"  [ERROR] DB 업데이트 오류: {e}")
        return False


def main():
    """메인 함수"""
    print("=" * 80)
    print("K-Startup 요약정보 추출 및 DB 업데이트")
    print("=" * 80)
    
    # K-Startup 정책 조회
    print("\n[Step 1] K-Startup 정책 조회...")
    
    result = supabase.table('policy_funds') \
        .select('id, title, url') \
        .eq('source_site', 'K-Startup') \
        .is_('raw_content', 'null') \
        .limit(10) \
        .execute()
    
    policies = result.data if result.data else []
    
    if not policies:
        print("  [WARN] raw_content가 비어있는 K-Startup 정책이 없습니다")
        return
    
    print(f"  [OK] {len(policies)}개 정책 발견\n")
    
    # 각 정책 처리
    print("[Step 2] 요약정보 추출 및 DB 업데이트...")
    print("-" * 80)
    
    success_count = 0
    fail_count = 0
    
    for policy in policies:
        policy_id = policy['id']
        title = policy.get('title', 'N/A')
        url = policy.get('url', '')
        
        print(f"\n정책: {title[:60]}...")
        
        if not url or url == 'null':
            print(f"  [WARN] URL이 없습니다. 스킵합니다.")
            fail_count += 1
            continue
        
        # 크롤링 및 요약 추출
        summary = scrape_policy_detail(policy_id, url)
        
        if summary:
            # DB 업데이트
            if update_policy_raw_content(policy_id, summary):
                success_count += 1
            else:
                fail_count += 1
        else:
            fail_count += 1
    
    # 결과 출력
    print("\n" + "=" * 80)
    print("[결과]")
    print(f"  성공: {success_count}개")
    print(f"  실패: {fail_count}개")
    print("=" * 80)


if __name__ == "__main__":
    main()
