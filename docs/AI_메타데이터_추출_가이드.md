# AI 기반 정책자금 메타데이터 추출 시스템 - 사용 가이드

## 🎯 구현 완료 사항

### ✅ 완료된 모듈

1. **환경 설정**
   - `.env` 파일에 Gemini, Supabase API 키 설정 완료
   - `requirements.txt` 생성 및 패키지 설치 완료

2. **API 파서** (`lib/parsers/api_parser.py`)
   - ✅ 공공데이터포털 API 데이터 파싱 기능
   - ✅ `sample_data.json` 파일 로드 및 변환 (테스트 성공: 10개 정책)

3. **Supabase DB 클라이언트** (`lib/db/supabase_client.py`)
   - ✅ Supabase 연결 성공
   - ✅ CRUD 함수 구현
   - ⏸️ 테이블 생성 필요 (`lib/db/create_table.sql` 실행)

4. **Gemini AI 분석기** (`lib/ai/gemini_analyzer.py`)
   - ✅ 코드 구현 완료
   - ⚠️ API 라이브러리 deprecated 경고 발생
   - 🔄 `google-generativeai` → `google.genai`로 마이그레이션 필요

5. **메인 파이프라인** (`scripts/analyze_policies.py`)
   - ✅ CLI 인터페이스 구현
   - ✅ 배치 분석 로직
   - ✅ DB / JSON 저장 옵션

## 🚨 알려진 이슈

### Gemini API 라이브러리 Deprecated

`google-generativeai` 패키지가 deprecated되어 새로운 `google.genai` 패키지로 전환이 필요합니다.

**임시 해결책**: 
- 현재는 `--no-db` 옵션으로 JSON 출력만 사용 가능
- Gemini 분석 없이 API 데이터만 처리

**근본 해결책** (향후 작업):
```bash
pip install google-genai
# gemini_analyzer.py 파일 업데이트 필요
```

## 📖 사용 방법

### 1. Supabase 테이블 생성

Supabase 대시보드에서 실행:
```sql
-- lib/db/create_table.sql 내용을 복사해서 실행
```

URL: https://kjsauyubrwcdrkpivjbk.supabase.co

### 2. 샘플 데이터 분석 (Gemini 없이)

```bash
# API 데이터 파싱만 테스트 (Gemini 분석 스킵)
python scripts/analyze_policies.py --limit 5 --no-db --output test_output.json
```

### 3. Gemini 분석 포함 (라이브러리 수정 후)

```bash
# 전체 파이프라인
python scripts/analyze_policies.py --limit 10

# DB 저장 스킵
python scripts/analyze_policies.py --all --no-db
```

## 🔧 다음 작업

### 우선순위 1: Gemini 라이브러리 마이그레이션

`lib/ai/gemini_analyzer.py` 파일을 새 라이브러리로 업데이트:

```python
# 변경 전
import google.generativeai as genai

# 변경 후
from google import genai
client = genai.Client(api_key=api_key)
```

### 우선순위 2: HWP 파서 구현

현재 HWP 파일 지원은 미구현 상태입니다.
`data/hwp_files/` 디렉토리는 준비되어 있으나 파서 로직 필요.

### 우선순위 3: 에러 로깅

시스템 전반에 걸친 로깅 시스템 추가 필요.

## 📁 파일 구조

```
policymatch-korea/
├── .env                      # 환경 변수
├── requirements.txt          # Python 패키지
├── lib/
│   ├── ai/
│   │   └── gemini_analyzer.py  # Gemini 분석기
│   ├── parsers/
│   │   └── api_parser.py       # API 파서
│   └── db/
│       ├── supabase_client.py  # DB 클라이언트
│       └── create_table.sql    # 테이블 생성 SQL
├── scripts/
│   ├── analyze_policies.py     # 메인 스크립트
│   └── test_system.py          # 시스템 테스트
└── data/
    └── hwp_files/              # HWP 파일 저장소
```

## ✅ 테스트 현황

- [x] API 파서: 10개 정책 파싱 성공
- [x] Supabase 연결: 성공
- [ ] Gemini 분석: 라이브러리 문제로 대기

## 💡 FAQ

**Q: Gemini API 키가 작동하지 않아요**
A: `google-generativeai` 라이브러리가 deprecated되었습니다. 새 `google.genai` 패키지로 마이그레이션이 필요합니다.

**Q: HWP 파일을 어떻게 처리하나요?**
A: 현재 HWP 파서는 미구현 상태입니다. `data/hwp_files/`에 파일을 저장하면 향후 자동 처리될 예정입니다.

**Q: DB 없이 사용할 수 있나요?**
A: 네! `--no-db --output result.json` 옵션으로 JSON 파일로 저장 가능합니다.
