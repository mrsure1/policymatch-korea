"""
전체 정책자금 수집 파이프라인 실행 스크립트

이 스크립트는 다음을 순차적으로 실행합니다:
1. 웹 스크래핑 (Bizinfo, K-Startup)
2. AI 메타데이터 분석 (Gemini)
3. Supabase DB 저장

사용법:
    python run_full_pipeline.py
    
옵션:
    --limit N       분석할 정책 최대 개수 (기본값: 전체)
    --skip-scraping 스크래핑 생략하고 기존 JSON 사용
"""

import asyncio
import sys
import os
import argparse
from pathlib import Path

# 프로젝트 루트 디렉토리를 Python path에 추가
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))


async def run_scraping():
    """웹 스크래핑 실행"""
    print("\n" + "="*60)
    print("Step 1/3: 웹 스크래핑 시작...")
    print("="*60 + "\n")
    
    from main import main as scrape_main
    await scrape_main()
    print("\n✅ 스크래핑 완료!\n")


def run_analysis():
    """AI 분석 및 DB 저장 실행"""
    print("\n" + "="*60)
    print("Step 2/3: AI 메타데이터 분석 및 DB 저장 시작...")
    print("="*60 + "\n")
    
    # analyze_policies.py를 직접 실행
    import subprocess
    result = subprocess.run(
        [sys.executable, "scripts/analyze_policies.py"],
        cwd=project_root,
        capture_output=False,
        text=True
    )
    
    if result.returncode == 0:
        print("\n✅ AI 분석 및 DB 저장 완료!\n")
    else:
        print(f"\n❌ AI 분석 중 오류 발생 (exit code: {result.returncode})\n")
        sys.exit(1)


def print_summary():
    """최종 요약 출력"""
    print("\n" + "="*60)
    print("Step 3/3: 완료 요약")
    print("="*60)
    print("\n✨ 전체 파이프라인 실행 완료!")
    print("\n📊 결과 확인:")
    print("   - 웹 앱: http://localhost:3000")
    print("   - Supabase: https://supabase.com/dashboard/project/kjsauyubrwcdrkpivjbk/editor")
    print("\n💡 다음 단계:")
    print("   1. 웹 앱에서 정책 데이터를 확인하세요")
    print("   2. 필터링이 올바르게 작동하는지 테스트하세요")
    print("   3. 정기 실행 스케줄을 설정하세요 (automation_guide.md 참조)")
    print("\n")


async def main():
    """메인 실행 함수"""
    parser = argparse.ArgumentParser(description='정책자금 전체 수집 파이프라인')
    parser.add_argument('--skip-scraping', action='store_true', 
                       help='스크래핑을 건너뛰고 기존 JSON 파일 사용')
    parser.add_argument('--limit', type=int, 
                       help='분석할 정책 최대 개수')
    
    args = parser.parse_args()
    
    print("\n" + "🚀 " + "="*56)
    print("    정책자금 자동 수집 파이프라인 시작")
    print("="*60 + "\n")
    
    try:
        # Step 1: 스크래핑
        if not args.skip_scraping:
            await run_scraping()
        else:
            print("\n⏭️  스크래핑 건너뛰기 (기존 JSON 사용)\n")
        
        # Step 2: AI 분석 및 DB 저장
        run_analysis()
        
        # Step 3: 요약
        print_summary()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다.\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ 오류 발생: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
