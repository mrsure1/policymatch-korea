"""
Gemini AI 분석 엔진

정책자금 공고 텍스트를 Gemini 2.0 Flash로 분석하여 메타데이터 추출
"""

import os
import json
import time
import asyncio
from typing import Dict, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()


class GeminiAnalyzer:
    """Gemini AI를 사용한 정책 분석기"""
    
    # 분석 프롬프트 템플릿
    ANALYSIS_PROMPT = """
너는 대한민국 정책자금 분석 전문가야. 
아래 공고문을 읽고 다음 정보를 추출해서 JSON 형식으로만 답해줘. 
없는 정보는 null로 표시해.

응답 형식 (JSON만, 다른 설명 없이):
{{
  "summary": "공고 내용을 3줄 이내로 요약",
  "region": "지원 대상 지역 (예: '서울', '경기', '전국', '부산' 등). 특정 지역 언급 없으면 '전국'",
  "biz_age": "지원 대상 업력 (예: '예비창업자', '3년미만', '7년미만', '제한없음')",
  "industry": "지원 대상 업종 (예: '제조업', 'IT/SW', '콘텐츠', '바이오', '무관')",
  "target_group": "특화 대상 (예: '청년', '여성', '장애인', '중장년', '일반')",
  "support_type": "지원 형태 (예: '융자', '보조금', '멘토링', '공간', '교육')",
  "amount": "지원 금액 또는 규모 (예: '최대 5천만원', '업체당 3백만원', '미명시')"
}}

공고문:
{policy_text}

JSON만 응답:
"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Gemini 분석기 초기화
        
        Args:
            api_key: Gemini API 키 (없으면 환경변수에서 로드)
        """
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")
        
        # Gemini 설정
        genai.configure(api_key=self.api_key)
        
        # 모델 초기화 (gemini-2.5-flash 사용 - 테스트 완료)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # 요청 간격 (Rate Limiting 대응 - 무료 티어는 더 길게)
        self.request_interval = 4  # 초 (하루 20개 제한 -> 분당 15회 허용으로 완화)
        self.last_request_time = 0
    
    async def analyze_policy(self, text: str, title: str = "") -> Dict:
        """
        정책 텍스트 분석하여 메타데이터 추출
        
        Args:
            text: 분석할 정책 공고 텍스트
            title: 정책 제목 (선택사항)
            
        Returns:
            {
                'summary': str,
                'region': str,
                'biz_age': str,
                'industry': str,
                'target_group': str,
                'support_type': str,
                'amount': str,
                'success': bool,
                'error': str | None
            }
        """
        try:
            # Rate Limiting
            await self._wait_for_rate_limit()
            
            # 텍스트 준비 (제목 포함)
            full_text = f"제목: {title}\n\n{text}" if title else text
            
            # 텍스트가 너무 길면 자르기 (Gemini 토큰 제한 대응)
            if len(full_text) > 10000:
                full_text = full_text[:10000] + "...(이하 생략)"
            
            # 프롬프트 생성
            prompt = self.ANALYSIS_PROMPT.format(policy_text=full_text)
            
            print(f"📊 분석 중: {title[:50]}..." if title else "📊 분석 중...")
            
            # Gemini API 호출
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config={
                    'temperature': 0.1,  # 일관된 결과를 위해 낮게 설정
                    'top_p': 0.8,
                    'top_k': 40,
                }
            )
            
            # 응답 텍스트 추출
            response_text = response.text
            
            # JSON 파싱
            metadata = self._parse_json_response(response_text)
            
            # 성공 표시
            metadata['success'] = True
            metadata['error'] = None
            
            print(f"✅ 분석 완료: {metadata.get('region', 'N/A')} | {metadata.get('industry', 'N/A')}")
            
            return metadata
            
        except Exception as e:
            error_msg = str(e)
            
            # 429 에러 (할당량 초과) 특별 처리
            if '429' in error_msg or 'quota' in error_msg.lower():
                print(f"⚠️  할당량 초과: 내일 다시 시도하세요 (하루 20개 제한)")
                return {
                    'summary': None,
                    'region': None,
                    'biz_age': None,
                    'industry': None,
                    'target_group': None,
                    'support_type': None,
                    'amount': None,
                    'success': False,
                    'error': 'API 할당량 초과 - 내일 다시 시도'
                }
            
            print(f"❌ 분석 실패: {error_msg[:100]}...")
            return {
                'summary': None,
                'region': None,
                'biz_age': None,
                'industry': None,
                'target_group': None,
                'support_type': None,
                'amount': None,
                'success': False,
                'error': error_msg[:200]
            }
    
    def _parse_json_response(self, response_text: str) -> Dict:
        """
        Gemini 응답에서 JSON 추출 및 파싱
        
        Args:
            response_text: Gemini의 원본 응답
            
        Returns:
            파싱된 메타데이터 딕셔너리
        """
        try:
            # 코드 블록 제거 (```json ... ```)
            if '```json' in response_text:
                start = response_text.find('```json') + 7
                end = response_text.rfind('```')
                response_text = response_text[start:end].strip()
            elif '```' in response_text:
                start = response_text.find('```') + 3
                end = response_text.rfind('```')
                response_text = response_text[start:end].strip()
            
            # JSON 파싱
            data = json.loads(response_text)
            
            # 필수 필드 검증 및 기본값 설정
            required_fields = [
                'summary', 'region', 'biz_age', 'industry',
                'target_group', 'support_type', 'amount'
            ]
            
            for field in required_fields:
                if field not in data:
                    data[field] = None
            
            return data
            
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON 파싱 실패: {e}")
            print(f"응답 내용: {response_text[:200]}...")
            
            # 파싱 실패 시 기본 구조 반환
            return {
                'summary': None,
                'region': None,
                'biz_age': None,
                'industry': None,
                'target_group': None,
                'support_type': None,
                'amount': None
            }
    
    async def _wait_for_rate_limit(self):
        """Rate Limiting을 위한 대기"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.request_interval:
            wait_time = self.request_interval - time_since_last_request
            print(f"⏳ Rate Limiting: {wait_time:.1f}초 대기 중...")
            await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()
    
    async def analyze_batch(self, texts: list[tuple[str, str]], 
                           batch_size: int = 10) -> list[Dict]:
        """
        여러 정책을 배치로 분석
        
        Args:
            texts: [(title, content), ...] 형태의 리스트
            batch_size: 한 번에 처리할 개수
            
        Returns:
            분석 결과 리스트
        """
        results = []
        total = len(texts)
        quota_exceeded = False
        
        print(f"\n{'='*60}")
        print(f"📊 배치 분석 시작: 총 {total}개")
        print(f"⏱️  API 호출 간격: {self.request_interval}초")
        print(f"{'='*60}\n")
        
        for i in range(0, total, batch_size):
            batch = texts[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (total + batch_size - 1) // batch_size
            
            print(f"\n🔄 배치 {batch_num}/{total_batches} 처리 중...")
            
            # 각 항목 분석
            for title, content in batch:
                result = await self.analyze_policy(content, title)
                result['title'] = title  # 제목 추가
                results.append(result)
                
                # 할당량 초과 감지 시 즉시 중단
                if not result['success'] and 'quota' in str(result.get('error', '')).lower():
                    quota_exceeded = True
                    print(f"\n⚠️  할당량 초과 감지 - 나머지 {total - len(results)}개 항목 스킵")
                    break
            
            if quota_exceeded:
                break
            
            print(f"✅ 배치 {batch_num} 완료: {len(batch)}개 처리됨\n")
            
            # 배치 간 추가 딜레이 (API 부하 분산)
            if batch_num < total_batches and not quota_exceeded:
                await asyncio.sleep(2)  # 배치 사이 2초 대기
        
        # 통계 출력
        success_count = sum(1 for r in results if r['success'])
        print(f"\n{'='*60}")
        print(f"📈 분석 완료")
        print(f"   성공: {success_count}/{total}")
        print(f"   실패: {total - success_count}/{total}")
        print(f"{'='*60}\n")
        
        return results


# 테스트 코드
async def test_analyzer():
    """분석기 테스트"""
    analyzer = GeminiAnalyzer()
    
    test_text = """
    2026년 초기창업패키지 지원사업 공고
    
    지원대상: 업력 3년 이내 서울 소재 창업기업
    지원내용: 사업화 자금 최대 1억원
    지원분야: IT, 콘텐츠, 제조업
    특화대상: 청년 창업자 우대
    """
    
    result = await analyzer.analyze_policy(test_text, "초기창업패키지")
    
    print("\n=== 분석 결과 ===")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(test_analyzer())
