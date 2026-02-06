-- Supabase 테이블 스키마 수정 스크립트
-- 기존 테이블이 있다면 amount 컬럼 추가

-- 1. policy_funds 테이블 존재 확인 및 생성
CREATE TABLE IF NOT EXISTS policy_funds (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    link TEXT,
    source_site TEXT,
    content_summary TEXT,
    region TEXT,
    biz_age TEXT,
    industry TEXT,
    target_group TEXT,
    support_type TEXT,
    amount TEXT,
    raw_content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. amount 컬럼이 없다면 추가 (에러 방지용 DO 블록)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='policy_funds' 
        AND column_name='amount'
    ) THEN
        ALTER TABLE policy_funds ADD COLUMN amount TEXT;
    END IF;
END $$;

-- 3. 인덱스 생성 (존재하지 않을 경우에만)
CREATE INDEX IF NOT EXISTS idx_policy_region ON policy_funds(region);
CREATE INDEX IF NOT EXISTS idx_policy_industry ON policy_funds(industry);
CREATE INDEX IF NOT EXISTS idx_policy_source ON policy_funds(source_site);
CREATE INDEX IF NOT EXISTS idx_policy_target ON policy_funds(target_group);

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

-- 5. 테이블 정보 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'policy_funds'
ORDER BY ordinal_position;

-- 6. 데이터 확인
SELECT COUNT(*) as total_count FROM policy_funds;
