"""
행정안전부_대한민국 공공서비스 정보 API 호출 스크립트

공공데이터포털 API를 사용하여 공공서비스 목록을 조회합니다.

API 문서: https://infuser.odcloud.kr/api/stages/44436/api-docs
"""

import requests
from typing import List, Dict, Optional
import json


class PublicServiceAPI:
    """행정안전부 공공서비스 정보 API 클라이언트 (odcloud)"""
    
    def __init__(self, service_key: str):
        """
        Args:
            service_key: e6e5a6b21891f23bcdf5953b54dc89a335ddfff7fbf2be2a335c39c70c0960bb
        """
        self.service_key = service_key
        self.base_url = "https://api.odcloud.kr/api"
        
    def get_service_list(
        self, 
        page: int = 1, 
        per_page: int = 10,
        service_name: Optional[str] = None,
        service_field: Optional[str] = None
    ) -> Dict:
        """
        공공서비스 목록 조회
        
        Args:
            page: 페이지 번호 (기본값: 1)
            per_page: 한 페이지 결과 수 (기본값: 10)
            service_name: 서비스명 검색 (선택사항, LIKE 검색)
            service_field: 서비스분야 검색 (선택사항, LIKE 검색)
            
        Returns:
            API 응답 데이터 (JSON)
        """
        # API 엔드포인트
        endpoint = f"{self.base_url}/gov24/v3/serviceList"
        
        # 요청 파라미터
        params = {
            "serviceKey": self.service_key,
            "page": page,
            "perPage": per_page,
            "returnType": "JSON"  # 응답 형식: JSON 또는 XML
        }
        
        # 선택적 검색 조건 추가
        if service_name:
            params["cond[서비스명::LIKE]"] = service_name
        if service_field:
            params["cond[서비스분야::LIKE]"] = service_field
        
        try:
            # API 호출
            print(f"🔗 요청 URL: {endpoint}")
            print(f"📝 파라미터: page={page}, perPage={per_page}")
            
            response = requests.get(endpoint, params=params, timeout=30)
            response.raise_for_status()  # HTTP 에러 체크
            
            # JSON 응답 파싱
            data = response.json()
            return data
            
        except requests.exceptions.RequestException as e:
            print(f"❌ API 호출 오류: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"응답 상태 코드: {e.response.status_code}")
                print(f"응답 내용: {e.response.text[:500]}")
            return None
        except json.JSONDecodeError as e:
            print(f"❌ JSON 파싱 오류: {e}")
            print(f"응답 내용: {response.text[:500]}")
            return None
    
    def print_service_summary(self, data: Dict) -> None:
        """
        서비스 목록을 요약하여 출력
        
        Args:
            data: API 응답 데이터
        """
        if not data:
            print("❌ 데이터가 없습니다.")
            return
        
        try:
            # odcloud API 응답 구조
            page = data.get("page", 0)
            per_page = data.get("perPage", 0)
            total_count = data.get("totalCount", 0)
            current_count = data.get("currentCount", 0)
            items = data.get("data", [])
            
            print(f"\n{'='*70}")
            print(f"📊 API 호출 결과")
            print(f"{'='*70}")
            print(f"✅ 성공적으로 데이터를 조회했습니다.")
            print(f"{'='*70}\n")
            
            print(f"📄 페이지: {page}")
            print(f"📋 총 {total_count}개의 서비스 중 {current_count}개 조회\n")
            
            if not items:
                print("⚠️  조회된 서비스가 없습니다.")
                return
            
            # 각 서비스 정보 출력
            for idx, item in enumerate(items, 1):
                service_id = item.get("서비스ID", "N/A")
                service_name = item.get("서비스명", "N/A")
                service_dept = item.get("소관기관명", "")
                service_summary = item.get("서비스목적요약", "")
                service_field = item.get("서비스분야", "")
                support_type = item.get("지원유형", "")
                
                print(f"{idx}. 🏛️  {service_name}")
                print(f"   📌 서비스 ID: {service_id}")
                
                if service_dept:
                    print(f"   🏢 소관기관: {service_dept}")
                    
                if support_type:
                    print(f"   🎯 지원유형: {support_type}")
                    
                if service_field:
                    print(f"   📂 서비스분야: {service_field}")
                    
                if service_summary:
                    # 요약이 너무 길면 80자로 제한
                    summary = service_summary[:80] + "..." if len(service_summary) > 80 else service_summary
                    print(f"   📝 요약: {summary}")
                    
                print()
                
        except Exception as e:
            print(f"❌ 데이터 파싱 중 오류 발생: {e}")
            print(f"\n전체 응답 데이터 구조:")
            print(json.dumps(data, indent=2, ensure_ascii=False)[:1000])


def main():
    """메인 함수"""
    
    # ==========================================
    # 📌 여기에 발급받은 API 키를 입력하세요
    # ==========================================
    SERVICE_KEY = "e6e5a6b21891f23bcdf5953b54dc89a335ddfff7fbf2be2a335c39c70c0960bb"
    
    # API 키 확인
    if SERVICE_KEY == "YOUR_SERVICE_KEY_HERE":
        print("\n" + "="*70)
        print("⚠️  API 키를 입력해주세요!")
        print("="*70)
        print("\n📝 설정 방법:")
        print("   1. 이 파일(fetch_public_service.py)을 열어주세요")
        print("   2. SERVICE_KEY 변수를 찾으세요 (약 130번째 줄)")
        print("   3. 'YOUR_SERVICE_KEY_HERE'를 발급받은 인증키로 교체하세요")
        print("\n💡 API 키 확인 방법:")
        print("   1. 공공데이터포털(https://www.data.go.kr) 로그인")
        print("   2. 마이페이지 → 오픈API → 개발계정")
        print("   3. '일반 인증키 (Encoding)' 복사")
        print("="*70 + "\n")
        return
    
    # API 클라이언트 생성
    api = PublicServiceAPI(SERVICE_KEY)
    
    print("\n" + "="*70)
    print("🚀 대한민국 공공서비스 정보 API 호출 시작")
    print("="*70)
    print(f"📊 최신 공공서비스 10개 조회 중...\n")
    
    # 서비스 목록 조회 (최신 10개)
    data = api.get_service_list(page=1, per_page=10)
    
    # 결과 출력
    if data:
        api.print_service_summary(data)
        
        print("="*70)
        print("✅ 조회 완료!")
        print("="*70)
    else:
        print("\n" + "="*70)
        print("❌ API 호출에 실패했습니다")
        print("="*70)
        print("\n🔍 확인사항:")
        print("   1. ✓ API 키가 올바른지 확인")
        print("   2. ✓ 공공데이터포털에서 API 활용신청이 승인되었는지 확인")
        print("   3. ✓ 네트워크 연결 상태 확인")
        print("   4. ✓ API 호출 횟수 제한 확인 (일일/트래픽 제한)")
        print("\n📞 문의:")
        print("   공공데이터포털 고객센터: 02-2100-0524")
        print("="*70 + "\n")


if __name__ == "__main__":
    main()
