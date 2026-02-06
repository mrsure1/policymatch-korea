# 🔧 Gemini API 할당량 관리 가이드

## ⚠️ 문제: 429 Too Many Requests

```
❌ 분석 실패: 429 You exceeded your current quota
```

이 에러는 **하루 무료 할당량을 초과**했을 때 발생합니다.

---

## 📊 무료 티어 제한

| 항목 | 제한 |
|------|------|
| **하루 최대 요청** | 20개 |
| **분당 최대 요청** | 15개 |
| **리셋 주기** | 24시간 |

**gemini-2.5-flash** 모델은 무료 티어에서 하루에 **20번**만 사용할 수 있습니다.

---

## ✅ 해결 방법

### 1. 내일 다시 시도 (무료)

가장 간단한 방법입니다. 24시간 후에 할당량이 자동으로 리셋됩니다.

```bash
# 내일 실행
python scripts/analyze_policies.py --limit 10
```

### 2. 소량씩 나눠서 실행 (무료)

오늘 남은 할당량을 확인하고 조금씩 실행:

```bash
# 3개씩만 분석
python scripts/analyze_policies.py --limit 3

# 하루에 여러 번 나눠서 실행하되, 총 20개 넘지 않게 주의
```

### 3. 유료 플랜으로 업그레이드

**Google AI Studio** 유료 플랜:
- 가격: $0.00015 per 1K characters (매우 저렴)
- 하루 제한: **1,500개 요청**
- URL: https://aistudio.google.com/app/apikey

**비용 예상**:
- 정책 1개 분석: 약 2,000 characters = $0.0003 (0.03원)
- 1,000개 분석: 약 $0.30 (300원)

---

## 🛡️ 할당량 절약 팁

### 1. 필터링 먼저

분석할 데이터를 미리 필터링:

```bash
# 특정 소스만 (API만)
python scripts/analyze_policies.py --source api --limit 10

# HWP 파일만
python scripts/analyze_policies.py --source hwp --limit 5
```

### 2. 로컬 캐싱

이미 분석한 데이터는 JSON으로 저장:

```bash
# 첫 실행: JSON으로 저장
python scripts/analyze_policies.py --limit 20 --no-db --output cached.json

# 나중에 JSON 데이터를 DB에 업로드 (Gemini 호출 없이)
```

### 3. 배치 크기 조정

한 번에 적게 처리:

```python
# gemini_analyzer.py 수정
# analyze_batch(..., batch_size=5)  # 기본 10 → 5로 줄임
```

---

## 📈 현재 설정

시스템이 자동으로 다음과 같이 설정되어 있습니다:

- **API 호출 간격**: 10초 (이전 4초 → 10초로 증가)
- **배치 간 대기**: 2초 추가
- **할당량 초과 감지**: 자동 중단

이 설정으로 **하루 20개 제한 내에서 안전하게 사용**할 수 있습니다.

---

## 🔍 할당량 확인 방법

### Google AI Studio에서 확인

1. https://aistudio.google.com/app/apikey 접속
2. 우측 상단 **사용량** 클릭
3. 오늘 사용한 요청 수 확인

---

## 💡 권장 워크플로우

### 개발/테스트 단계 (무료 티어)

```bash
# 하루 일정
09:00 - 소량 테스트 (5개)
python scripts/analyze_policies.py --limit 5

12:00 - 기능 검증 (5개)
python scripts/analyze_policies.py --limit 5

15:00 - 최종 확인 (5개)
python scripts/analyze_policies.py --limit 5

18:00 - 예비 (5개)
# 총 20개 이내
```

### 프로덕션 단계 (유료)

```bash
# 제한 없이 대량 처리
python scripts/analyze_policies.py --all
```

---

## ⚙️ 수정된 코드

```python
# lib/ai/gemini_analyzer.py

# 요청 간격 10초로 증가
self.request_interval = 10  # 초

# 할당량 초과 시 자동 중단
if '429' in error_msg or 'quota' in error_msg.lower():
    print("⚠️  할당량 초과 - 내일 다시 시도")
    break
```

---

## 📞 추가 도움

- **문서**: https://ai.google.dev/gemini-api/docs/rate-limits
- **가격**: https://ai.google.dev/pricing
- **사용량 모니터링**: https://aistudio.google.com/app/apikey
