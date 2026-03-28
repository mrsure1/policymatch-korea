-- K-Startup AI 파싱 필드 추가 마이그레이션
-- Supabase 대시보드 SQL Editor에서 실행하세요.

-- policy_funds 테이블에 AI 파싱 컬럼 추가
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS notice_id TEXT;
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS roadmap_stage JSONB DEFAULT '[]';
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS required_documents_count INTEGER DEFAULT 0;
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS required_documents_list JSONB DEFAULT '[]';

-- 검색 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_policy_funds_notice_id ON policy_funds(notice_id);
CREATE INDEX IF NOT EXISTS idx_policy_funds_required_docs_count ON policy_funds(required_documents_count);
CREATE INDEX IF NOT EXISTS idx_policy_funds_roadmap_gin ON policy_funds USING GIN(roadmap_stage);
CREATE INDEX IF NOT EXISTS idx_policy_funds_docs_gin ON policy_funds USING GIN(required_documents_list);
