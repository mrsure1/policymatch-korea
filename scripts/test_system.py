"""
시스템 테스트 스크립트

모든 모듈이 정상 작동하는지 확인
"""

import sys
import asyncio
from pathlib import Path

# 프로젝트 루트 경로 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


async def test_gemini_connection():
    """Gemini API 연결 테스트"""
    print("\n" + "="*60)
    print("🧪 Test 1: Gemini API 연결")
    print("="*60)
    
    try:
        from lib.ai.gemini_analyzer import GeminiAnalyzer
        
        analyzer = GeminiAnalyzer()
        print("✅ Gemini 인스턴스 생성 성공")
        
        # 간단한 분석 테스트
        test_text = """
        2026년 청년 창업 지원사업
        
        서울시에서 만 39세 이하 청년 창업자를 대상으로
        최대 3천만원의 사업화 자금을 지원합니다.
        IT, 콘텐츠, 제조업 분야가 지원 대상입니다.
        """
        
        print("📊 테스트 분석 실행 중...")
        result = await analyzer.analyze_policy(test_text, "청년 창업 지원사업")
        
        if result['success']:
            print("✅ 분석 성공!")
            print(f"   지역: {result.get('region')}")
            print(f"   업종: {result.get('industry')}")
            print(f"   대상: {result.get('target_group')}")
            return True
        else:
            print(f"❌ 분석 실패: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_parser():
    """API 파서 테스트"""
    print("\n" + "="*60)
    print("🧪 Test 2: API 파서")
    print("="*60)
    
    try:
        from lib.parsers.api_parser import parse_sample_data_json
        
        sample_path = project_root / 'sample_data.json'
        
        if not sample_path.exists():
            print(f"⚠️  {sample_path} 파일 없음 - 테스트 스킵")
            return True
        
        data = parse_sample_data_json(str(sample_path))
        
        if data:
            print(f"✅ {len(data)}개 정책 파싱 성공")
            print(f"   샘플: {data[0][0][:50]}...")
            return True
        else:
            print("❌ 파싱 실패")
            return False
            
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_supabase_connection():
    """Supabase 연결 테스트"""
    print("\n" + "="*60)
    print("🧪 Test 3: Supabase DB 연결")
    print("="*60)
    
    try:
        from lib.db.supabase_client import SupabaseClient
        
        client = SupabaseClient()
        print("✅ Supabase 클라이언트 생성 성공")
        
        # 테스트 쿼리 (테이블이 없을 수도 있음)
        print("⚠️  실제 DB 쿼리는 테이블 생성 후 가능합니다.")
        print("   Supabase 대시보드에서 lib/db/create_table.sql을 실행하세요.")
        
        return True
        
    except Exception as e:
        print(f"❌ 테스트 실패: {e}")
        print("   .env.local의 SUPABASE_URL과 SUPABASE_KEY를 확인하세요.")
        return False


async def run_all_tests():
    """모든 테스트 실행"""
    print("\n" + "="*60)
    print("🚀 시스템 테스트 시작")
    print("="*60)
    
    results = []
    
    # Test 1: Gemini
    results.append(await test_gemini_connection())
    
    # Test 2: API Parser
    results.append(test_api_parser())
    
    # Test 3: Supabase
    results.append(test_supabase_connection())
    
    # 결과 요약
    print("\n" + "="*60)
    print("📊 테스트 결과 요약")
    print("="*60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"통과: {passed}/{total}")
    
    if passed == total:
        print("✅ 모든 테스트 통과!")
    else:
        print("⚠️  일부 테스트 실패")
    
    print("\n다음 단계:")
    print("1. Supabase 대시보드에서 테이블 생성")
    print("   → lib/db/create_table.sql 실행")
    print("2. 샘플 데이터 분석 테스트")
    print("   → python scripts/analyze_policies.py --limit 3 --no-db")
    print("3. DB 저장 테스트")
    print("   → python scripts/analyze_policies.py --limit 3")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
