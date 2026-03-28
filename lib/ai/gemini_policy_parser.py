"""
정책 공고문 AI 파싱 모듈

비정형 본문(줄글)을 Gemini API로 분석하여 구조화된 JSON을 추출합니다.
- roadmap_stage: 로드맵 단계 (숫자 배열 또는 정규화된 텍스트)
- required_documents_count: 필수 제출 서류 개수
- required_documents_list: 제출 서류 목록 (문자열 배열)
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Any, Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# 엄격한 JSON 스키마 안내 프롬프트
EXTRACTION_PROMPT = """너는 대한민국 정책자금 공고문 분석 전문가입니다.

아래 공고문 본문(HTML 또는 일반 텍스트)에서 다음 3가지 정보를 **반드시** 추출하여,
JSON 형식으로만 응답하세요. 다른 설명이나 마크다운 없이 순수 JSON만 출력합니다.

## 추출 필드

1. **roadmap_stage**: 로드맵/신청 절차 단계
   - "선정절차", "신청절차", "진행절차", "평가절차" 등에서 단계를 추출
   - 숫자 배열 예: [1, 2, 3, 4] 또는 ["1단계", "2단계", ...]
   - 텍스트 배열 예: ["접수", "서류심사", "면접", "선정"]
   - 파악 불가 시 빈 배열 []

2. **required_documents_count**: 필수 제출 서류의 총 개수 (숫자만)
   - "제출서류", "구비서류", "필수서류" 섹션에서 **필수** 항목만 카운트
   - 선택/우대 서류는 제외
   - 파악 불가 시 0

3. **required_documents_list**: 필수 제출 서류 목록 (문자열 배열)
   - 각 서류명을 하나의 문자열로 (예: "사업계획서", "사업자등록증 사본")
   - required_documents_count와 개수가 일치해야 함
   - 파악 불가 시 빈 배열 []

## 출력 형식 (이 구조를 그대로 따르세요)

{"roadmap_stage": [], "required_documents_count": 0, "required_documents_list": []}

위 JSON 이외의 글자는 출력하지 마세요.
"""


@dataclass
class ParsedPolicyMeta:
    """파싱 결과 데이터 클래스"""
    roadmap_stage: list[Any]  # [1,2,3] 또는 ["1단계","2단계"] 등
    required_documents_count: int
    required_documents_list: list[str]


def _strip_html(html: str) -> str:
    """HTML 태그 제거 후 텍스트만 반환"""
    if not html:
        return ""
    text = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", html, flags=re.IGNORECASE)
    text = re.sub(r"<style[^>]*>[\s\S]*?</style>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_json_response(raw: str) -> dict[str, Any]:
    """
    Gemini 응답에서 JSON만 추출하여 파싱.

    코드 블록(```json ... ```)이나 주변 텍스트를 제거하고
    순수 JSON 문자열만 추출합니다.
    """
    text = raw.strip()

    # 코드 블록 제거
    if "```json" in text:
        start = text.find("```json") + 7
        end = text.rfind("```")
        text = text[start:end].strip()
    elif "```" in text:
        start = text.find("```") + 3
        end = text.rfind("```")
        text = text[start:end].strip()

    # JSON 객체만 추출 (중괄호로 감싼 부분)
    brace_start = text.find("{")
    brace_end = text.rfind("}")
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        text = text[brace_start : brace_end + 1]

    return json.loads(text)


def _normalize_parsed(data: dict[str, Any]) -> ParsedPolicyMeta:
    """파싱 결과 검증 및 정규화"""
    roadmap = data.get("roadmap_stage")
    if not isinstance(roadmap, list):
        roadmap = []

    count = data.get("required_documents_count", 0)
    if not isinstance(count, (int, float)):
        try:
            count = int(count) if count else 0
        except (ValueError, TypeError):
            count = 0
    count = max(0, int(count))

    docs = data.get("required_documents_list", [])
    if not isinstance(docs, list):
        docs = []
    docs = [str(d).strip() for d in docs if d]

    # count와 실제 리스트 길이 불일치 시 리스트 기준으로 조정
    if count != len(docs):
        count = len(docs)

    return ParsedPolicyMeta(
        roadmap_stage=roadmap,
        required_documents_count=count,
        required_documents_list=docs,
    )


class GeminiPolicyParser:
    """
    Gemini API를 사용한 정책 공고문 구조화 파서.

    비정형 본문에서 roadmap_stage, required_documents_count,
    required_documents_list를 엄격한 JSON 형식으로 추출합니다.
    """

    # 사용할 모델 (Gemini 3 Pro → 2.5 Flash 순으로 폴백)
    MODEL_CANDIDATES = [
        "gemini-2.5-flash-preview-05-20",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]

    def __init__(self, api_key: Optional[str] = None, request_interval: float = 4.0):
        """
        Args:
            api_key: Gemini API 키 (없으면 GEMINI_API_KEY 환경변수 사용)
            request_interval: 요청 간 최소 대기 시간(초)
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY가 설정되지 않았습니다.")

        genai.configure(api_key=self.api_key)
        self.model = self._resolve_model()
        self.request_interval = request_interval
        self._last_request_time = 0.0

    def _resolve_model(self):
        """사용 가능한 모델 선택"""
        for name in self.MODEL_CANDIDATES:
            try:
                model = genai.GenerativeModel(name)
                return model
            except Exception as e:
                logger.debug("모델 %s 건너뜀: %s", name, e)
                continue
        raise RuntimeError("사용 가능한 Gemini 모델을 찾을 수 없습니다.")

    def _wait_rate_limit(self) -> None:
        """요청 간격 대기"""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.request_interval:
            sleep_time = self.request_interval - elapsed
            logger.info("Rate limit 대기: %.1f초", sleep_time)
            time.sleep(sleep_time)
        self._last_request_time = time.time()

    def parse_policy_body(
        self,
        body_text: str,
        title: str = "",
        max_text_length: int = 12000,
    ) -> ParsedPolicyMeta:
        """
        공고 본문에서 구조화된 메타데이터 추출.

        Args:
            body_text: 본문 HTML 또는 일반 텍스트
            title: 공고 제목 (선택, 컨텍스트 보강용)
            max_text_length: 전송할 최대 텍스트 길이 (토큰 제한 대응)

        Returns:
            ParsedPolicyMeta (roadmap_stage, required_documents_count, required_documents_list)
        """
        self._wait_rate_limit()

        # HTML이면 텍스트만 추출
        text = _strip_html(body_text) if body_text.strip().startswith("<") else body_text

        if len(text) > max_text_length:
            text = text[:max_text_length] + "...(이하 생략)"

        context = f"제목: {title}\n\n" if title else ""
        context += f"본문:\n{text}"

        full_prompt = f"{EXTRACTION_PROMPT}\n\n{context}"

        try:
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=1024,
                ),
            )

            raw = response.text if hasattr(response, "text") else str(response)
            data = _parse_json_response(raw)
            return _normalize_parsed(data)

        except json.JSONDecodeError as e:
            logger.warning("JSON 파싱 실패: %s", e)
            return ParsedPolicyMeta(
                roadmap_stage=[],
                required_documents_count=0,
                required_documents_list=[],
            )
        except Exception as e:
            logger.exception("파싱 오류: %s", e)
            return ParsedPolicyMeta(
                roadmap_stage=[],
                required_documents_count=0,
                required_documents_list=[],
            )

    def parse_and_return_json(
        self,
        body_text: str,
        title: str = "",
        max_text_length: int = 12000,
    ) -> dict[str, Any]:
        """
        parse_policy_body와 동일하지만 딕셔너리로 반환.

        Returns:
            {
                "roadmap_stage": [...],
                "required_documents_count": int,
                "required_documents_list": [...]
            }
        """
        meta = self.parse_policy_body(body_text, title, max_text_length)
        return {
            "roadmap_stage": meta.roadmap_stage,
            "required_documents_count": meta.required_documents_count,
            "required_documents_list": meta.required_documents_list,
        }


# 간편 함수
def extract_policy_metadata(
    body_html_or_text: str,
    title: str = "",
    api_key: Optional[str] = None,
) -> dict[str, Any]:
    """
    비정형 공고 본문에서 메타데이터 추출 (편의 함수).

    Args:
        body_html_or_text: 본문 HTML 또는 텍스트
        title: 공고 제목 (선택)
        api_key: API 키 (선택)

    Returns:
        {"roadmap_stage", "required_documents_count", "required_documents_list"}
    """
    parser = GeminiPolicyParser(api_key=api_key)
    return parser.parse_and_return_json(body_html_or_text, title)


if __name__ == "__main__":
    # 테스트
    sample = """
    신청절차: 1. 접수 2. 서류심사 3. 발표심사 4. 최종선정
    제출서류: 사업계획서, 사업자등록증, 대표자 신분증 사본
    """
    result = extract_policy_metadata(sample, "테스트 공고")
    print(json.dumps(result, ensure_ascii=False, indent=2))
