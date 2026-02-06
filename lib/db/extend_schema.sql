-- Supabase 테이블 스키마 확장
-- UI 기능을 위한 추가 컬럼 생성

-- 1. 기존 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'policy_funds'
ORDER BY ordinal_position;

-- 2. UI 기능을 위한 추가 컬럼
ALTER TABLE policy_funds 
ADD COLUMN IF NOT EXISTS agency TEXT,
ADD COLUMN IF NOT EXISTS application_period TEXT,
ADD COLUMN IF NOT EXISTS d_day INTEGER,
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS mobile_url TEXT,
ADD COLUMN IF NOT EXISTS roadmap JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}'::jsonb;

-- 3. 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_policy_d_day ON policy_funds(d_day);
CREATE INDEX IF NOT EXISTS idx_policy_agency ON policy_funds(agency);

-- 4. roadmap JSONB 구조 예시:
-- [
--   {
--     "step": 1,
--     "title": "회원가입",
--     "description": "K-Startup 홈페이지에서 회원가입",
--     "estimatedDays": 1
--   },
--   ...
-- ]

-- 5. documents JSONB 구조 예시:
-- [
--   {
--     "name": "사업자등록증",
--     "category": "필수",
--     "whereToGet": "홈택스",
--     "link": "https://www.hometax.go.kr"
--   },
--   ...
-- ]

-- 6. criteria JSONB 구조 예시:
-- {
--   "entityTypes": ["예비창업자", "소상공인"],
--   "ageGroups": ["청년 (39세 이하)"],
--   "regions": ["서울", "경기"],
--   "industries": ["IT", "제조업"],
--   "businessPeriods": ["1년 미만", "1-3년"]
-- }

-- 7. 최종 테이블 구조 확인
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'policy_funds'
ORDER BY ordinal_position;

-- 8. 샘플 데이터 확인
SELECT id, title, region, industry, agency, d_day
FROM policy_funds
LIMIT 5;
