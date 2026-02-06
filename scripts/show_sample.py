"""
공공서비스 API 샘플 데이터 조회 및 표시

터미널에서 보기 좋게 샘플 데이터를 표시합니다.
"""

import requests
import json

# API 설정
SERVICE_KEY = "e6e5a6b21891f23bcdf5953b54dc89a335ddfff7fbf2be2a335c39c70c0960bb"
BASE_URL = "https://api.odcloud.kr/api"

def get_sample_data():
    """공공서비스 목록 샘플 조회"""
    endpoint = f"{BASE_URL}/gov24/v3/serviceList"
    
    params = {
        "serviceKey": SERVICE_KEY,
        "page": 1,
        "perPage": 10,
        "returnType": "JSON"
    }
    
    try:
        print("API 호출 중...")
        response = requests.get(endpoint, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        # 결과를 파일로 저장
        with open("sample_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print("\n" + "="*80)
        print("샘플 데이터 조회 성공!")
        print("="*80)
        
        # 기본 정보 출력
        total_count = data.get("totalCount", 0)
        current_count = data.get("currentCount", 0)
        items = data.get("data", [])
        
        print(f"\n총 {total_count}개 서비스 중 {current_count}개 조회됨")
        print(f"sample_data.json 파일에 전체 데이터가 저장되었습니다.\n")
        
        # 각 서비스 요약 출력 (영문으로)
        print("="*80)
        print("SERVICE LIST")
        print("="*80)
        
        for idx, item in enumerate(items, 1):
            service_id = item.get("서비스ID", "N/A")
            service_name = item.get("서비스명", "N/A")
            service_dept = item.get("소관기관명", "")
            support_type = item.get("지원유형", "")
            
            print(f"\n[{idx}] {service_name}")
            print(f"    Service ID: {service_id}")
            if service_dept:
                print(f"    Department: {service_dept}")
            if support_type:
                print(f"    Support Type: {support_type}")
        
        print("\n" + "="*80)
        print(f"저장된 파일: sample_data.json (전체 데이터 확인 가능)")
        print("="*80)
        
        return data
        
    except Exception as e:
        print(f"오류 발생: {e}")
        return None

if __name__ == "__main__":
    get_sample_data()
