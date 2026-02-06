-- ================================================
-- Supabase 전체 스키마 생성 스크립트
-- (테이블 생성 + 확장 컬럼 추가 통합)
-- ================================================

-- 1. 기존 테이블 삭제 (완전히 새로 시작하려면 주석 해제)
-- DROP TABLE IF EXISTS policy_funds CASCADE;

-- 2. policy_funds 테이블 생성 (모든 컬럼 포함)
CREATE TABLE IF NOT EXISTS policy_funds (
    id SERIAL PRIMARY KEY,
    
    -- 기본 정보
    title TEXT NOT NULL UNIQUE,
    link TEXT,
    source_site TEXT,
    
    -- AI 분석 메타데이터
    content_summary TEXT,
    region TEXT,
    biz_age TEXT,
    industry TEXT,
    target_group TEXT,
    support_type TEXT,
    amount TEXT,
    raw_content TEXT,
    
    -- UI 추가 필드
    agency TEXT,
    application_period TEXT,
    d_day INTEGER,
    url TEXT,
    mobile_url TEXT,
    
    -- JSONB 필드 (복잡한 데이터 구조)
    roadmap JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    criteria JSONB DEFAULT '{}'::jsonb,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_policy_region ON policy_funds(region);
CREATE INDEX IF NOT EXISTS idx_policy_industry ON policy_funds(industry);
CREATE INDEX IF NOT EXISTS idx_policy_source ON policy_funds(source_site);
CREATE INDEX IF NOT EXISTS idx_policy_target ON policy_funds(target_group);
CREATE INDEX IF NOT EXISTS idx_policy_d_day ON policy_funds(d_day);
CREATE INDEX IF NOT EXISTS idx_policy_agency ON policy_funds(agency);

-- 4. 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_update_policy_updated_at ON policy_funds;

CREATE TRIGGER trigger_update_policy_updated_at
    BEFORE UPDATE ON policy_funds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- 5. Row Level Security (RLS) 설정 (선택사항)
-- 공개 읽기 허용
ALTER TABLE policy_funds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
    ON policy_funds FOR SELECT
    USING (true);

-- 6. 테이블 구조 확인
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'policy_funds'
ORDER BY ordinal_position;

-- 7. 데이터 확인
SELECT 
    COUNT(*) as total_policies,
    COUNT(DISTINCT region) as unique_regions,
    COUNT(DISTINCT industry) as unique_industries
FROM policy_funds;

-- 8. 샘플 데이터 조회
SELECT 
    id, 
    title, 
    region, 
    industry, 
    amount,
    agency,
    d_day,
    created_at
FROM policy_funds
ORDER BY created_at DESC
LIMIT 5;
