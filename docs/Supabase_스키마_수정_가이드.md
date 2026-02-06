# Supabase DB 스키마 수정 가이드

## 🚨 문제 상황

DB 저장 시 아래 에러 발생:
```
Could not find the 'amount' column of 'policy_funds' in the schema cache
```

## ✅ 해결 방법

### 방법 1: Supabase 대시보드에서 SQL 실행 (권장)

1. **Supabase 대시보드 접속**
   - URL: https://kjsauyubrwcdrkpivjbk.supabase.co
   - 왼쪽 메뉴에서 **SQL Editor** 클릭

2. **SQL 스크립트 실행**
   - `lib/db/create_table.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - **RUN** 버튼 클릭

3. **결과 확인**
   - 마지막에 컬럼 목록이 출력되어야 함
   - `amount` 컬럼이 포함되어 있는지 확인

### 방법 2: 기존 테이블 수정

만약 이미 `policy_funds` 테이블이 있고 `amount` 컬럼만 없다면:

```sql
-- amount 컬럼 추가
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS amount TEXT;

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'policy_funds';
```

### 방법 3: 테이블 재생성 (데이터 삭제 주의!)

```sql
-- 기존 테이블 삭제 (데이터도 함께 삭제됨!)
DROP TABLE IF EXISTS policy_funds CASCADE;

-- 그 다음 create_table.sql 실행
```

## 📋 필요한 컬럼 목록

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | SERIAL | 자동 증가 ID |
| title | TEXT | 정책 제목 (UNIQUE) |
| link | TEXT | 상세 페이지 링크 |
| source_site | TEXT | 출처 (GOV24_API 등) |
| content_summary | TEXT | AI 생성 요약 |
| region | TEXT | 지원 지역 |
| biz_age | TEXT | 업력 요건 |
| industry | TEXT | 업종 |
| target_group | TEXT | 특화 대상 |
| support_type | TEXT | 지원 유형 |
| **amount** | TEXT | **지원 금액** ⬅️ 이 컬럼이 누락됨 |
| raw_content | TEXT | 원본 텍스트 |
| created_at | TIMESTAMP | 생성 시각 |
| updated_at | TIMESTAMP | 수정 시각 |

## 🔧 테스트

SQL 실행 후 다시 테스트:

```bash
python scripts/analyze_policies.py --limit 3
```

성공 시:
```
✅ 1. 유아학비 (누리과정) 지원... → DB 저장 완료
✅ 2. 근로·자녀장려금... → DB 저장 완료
✅ 3. 주택금융공사 월세자금보증... → DB 저장 완료
```
