"""
API 데이터 파서

공공데이터포털 API 및 크롤링 JSON 데이터를 분석용 텍스트로 변환
"""

import json
from typing import Dict, List, Optional


def parse_gov24_service(item: Dict) -> str:
    """
    정부24 공공서비스 API 데이터 → 분석용 텍스트
    
    Args:
        item: API 응답의 개별 서비스 데이터
        
    Returns:
        Gemini 분석용 통합 텍스트
    """
    parts = []
    
    # 서비스명
    if '서비스명' in item:
        parts.append(f"서비스명: {item['서비스명']}")
    
    # 서비스 목적 요약
    if '서비스목적요약' in item:
        parts.append(f"목적: {item['서비스목적요약']}")
    
    # 지원 대상
    if '지원대상' in item:
        parts.append(f"지원대상: {item['지원대상']}")
    
    # 선정 기준
    if '선정기준' in item:
        parts.append(f"선정기준: {item['선정기준']}")
    
    # 지원 내용
    if '지원내용' in item:
        parts.append(f"지원내용: {item['지원내용']}")
    
    # 신청 방법
    if '신청방법' in item:
        parts.append(f"신청방법: {item['신청방법']}")
    
    # 소관기관
    if '소관기관명' in item:
        parts.append(f"소관기관: {item['소관기관명']}")
    
    # 지원 유형
    if '지원유형' in item:
        parts.append(f"지원유형: {item['지원유형']}")
    
    # 서비스 분야
    if '서비스분야' in item:
        parts.append(f"분야: {item['서비스분야']}")
    
    return "\n\n".join(parts)


def parse_policy_json(json_path: str) -> List[tuple[str, str]]:
    """
    policies.json 파일 파싱
    
    Args:
        json_path: JSON 파일 경로
        
    Returns:
        [(title, link), ...] 형태의 리스트
    """
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = []
        for item in data:
            title = item.get('title', '')
            link = item.get('link', '')
            source = item.get('source_site', '')
            
            # 제목만 반환 (상세 내용은 크롤링 필요)
            if title:
                # (title, content, link) 튜플 반환
                results.append((title, f"출처: {source}\nURL: {link}", link))
        
        return results
        
    except Exception as e:
        print(f"❌ JSON 파싱 오류: {e}")
        return []


def parse_sample_data_json(json_path: str) -> List[tuple[str, str]]:
    """
    sample_data.json (정부24 API 응답) 파일 파싱
    
    Args:
        json_path: JSON 파일 경로
        
    Returns:
        [(title, content), ...] 형태의 리스트
    """
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        results = []
        items = data.get('data', [])
        
        for item in items:
            title = item.get('서비스명', '')
            content = parse_gov24_service(item)
            link = item.get('상세조회URL', '')
            
            if title and content:
                results.append((title, content, link))
        
        print(f"✅ {len(results)}개 정책 데이터 로드됨")
        return results
        
    except Exception as e:
        print(f"❌ JSON 파싱 오류: {e}")
        return []


def combine_api_data(sample_data_path: str, policies_path: Optional[str] = None) -> List[tuple[str, str]]:
    """
    여러 JSON 파일의 데이터를 통합
    
    Args:
        sample_data_path: sample_data.json 경로
        policies_path: policies.json 경로 (선택)
        
    Returns:
        통합된 [(title, content), ...] 리스트
    """
    results = []
    
    # sample_data.json (정부24 API)
    print("\n📂 sample_data.json 로드 중...")
    results.extend(parse_sample_data_json(sample_data_path))
    
    # policies.json (크롤링 데이터) - 선택적
    if policies_path:
        print("\n📂 policies.json 로드 중...")
        policy_data = parse_policy_json(policies_path)
        results.extend(policy_data)
    
    print(f"\n✅ 총 {len(results)}개 정책 로드 완료\n")
    return results


# 테스트 코드
if __name__ == "__main__":
    # 테스트: sample_data.json 파싱
    data = parse_sample_data_json("sample_data.json")
    
    if data:
        print("\n=== 첫 번째 항목 ===")
        title, content = data[0]
        print(f"제목: {title}")
        print(f"\n내용:\n{content[:500]}...")
