"""
Gemini 모델 버전 테스트

여러 Gemini 모델을 테스트하여 작동하는 버전 찾기
"""

import os
from dotenv import load_dotenv
import google.generativeai as genai

# 환경 변수 로드
load_dotenv()

# API 키 가져오기
api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ GEMINI_API_KEY가 설정되지 않았습니다.")
    exit(1)

# 테스트할 모델 목록
models_to_test = [
    'gemini-2.0-flash-exp',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
]

print("\n" + "="*70)
print("🧪 Gemini 모델 버전 테스트")
print("="*70 + "\n")

# Gemini 설정
genai.configure(api_key=api_key)

# 테스트 프롬프트
test_prompt = "안녕하세요. 이 메시지에 '성공'이라고 짧게 답해주세요."

successful_models = []

for model_name in models_to_test:
    print(f"📊 테스트 중: {model_name}")
    
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(test_prompt)
        
        # 응답 확인
        if response and response.text:
            print(f"   ✅ 성공! 응답: {response.text[:50]}")
            successful_models.append(model_name)
        else:
            print(f"   ❌ 응답 없음")
    
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            print(f"   ❌ 모델 없음")
        elif "quota" in error_msg.lower():
            print(f"   ⚠️  할당량 초과")
        else:
            print(f"   ❌ 오류: {error_msg[:80]}")
    
    print()

# 결과 요약
print("\n" + "="*70)
print("📊 테스트 결과 요약")
print("="*70 + "\n")

if successful_models:
    print(f"✅ 작동하는 모델: {len(successful_models)}개\n")
    for idx, model in enumerate(successful_models, 1):
        print(f"{idx}. {model}")
    
    print(f"\n💡 권장 모델: {successful_models[0]}")
else:
    print("❌ 작동하는 모델을 찾지 못했습니다.")
    print("\n🔍 확인사항:")
    print("1. API 키가 올바른지 확인")
    print("2. Google AI Studio에서 Gemini API 접근 권한 확인")
    print("3. 할당량이 남아있는지 확인")

print("\n" + "="*70 + "\n")