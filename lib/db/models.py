"""
정책자금 데이터베이스 스키마

SQLAlchemy 모델 기반 스키마 정의.
roadmap_stage, required_documents_count, required_documents_list 등
AI 파싱 결과를 저장하고 검색 최적화를 위한 인덱스를 설계합니다.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

# SQLAlchemy Optional import (Supabase 사용 시 불필요할 수 있음)
try:
    from sqlalchemy import (
        Column,
        DateTime,
        Index,
        Integer,
        String,
        Text,
        create_engine,
    )
    from sqlalchemy.dialects.postgresql import ARRAY, JSONB
    from sqlalchemy.orm import declarative_base

    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False
    declarative_base = lambda: None  # type: ignore


# Supabase/PostgreSQL 호환 DDL (SQLAlchemy 없이도 사용 가능)
POLICY_FUNDS_DDL = """
-- 정책자금 테이블 (AI 파싱 필드 포함)
CREATE TABLE IF NOT EXISTS policy_funds (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    link TEXT,
    url TEXT,
    source_site TEXT DEFAULT 'K-STARTUP',
    notice_id TEXT,
    
    -- 기본 메타데이터
    content_summary TEXT,
    region TEXT,
    biz_age TEXT,
    industry TEXT,
    target_group TEXT,
    support_type TEXT,
    amount TEXT,
    agency TEXT,
    application_period TEXT,
    application_method TEXT,
    inquiry TEXT,
    
    -- AI 파싱 결과 (Gemini)
    roadmap_stage JSONB DEFAULT '[]',
    required_documents_count INTEGER DEFAULT 0,
    required_documents_list JSONB DEFAULT '[]',
    
    -- 원본 데이터
    raw_content TEXT,
    detail_content TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 중복 방지
    UNIQUE(notice_id)
);

-- 검색 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_policy_funds_notice_id ON policy_funds(notice_id);
CREATE INDEX IF NOT EXISTS idx_policy_funds_source_site ON policy_funds(source_site);
CREATE INDEX IF NOT EXISTS idx_policy_funds_region ON policy_funds(region);
CREATE INDEX IF NOT EXISTS idx_policy_funds_industry ON policy_funds(industry);
CREATE INDEX IF NOT EXISTS idx_policy_funds_biz_age ON policy_funds(biz_age);
CREATE INDEX IF NOT EXISTS idx_policy_funds_target_group ON policy_funds(target_group);
CREATE INDEX IF NOT EXISTS idx_policy_funds_required_docs_count ON policy_funds(required_documents_count);
CREATE INDEX IF NOT EXISTS idx_policy_funds_roadmap_gin ON policy_funds USING GIN(roadmap_stage);
CREATE INDEX IF NOT EXISTS idx_policy_funds_docs_gin ON policy_funds USING GIN(required_documents_list);

-- 전문 검색 (제목+요약)
CREATE INDEX IF NOT EXISTS idx_policy_funds_title_fts ON policy_funds 
    USING GIN(to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content_summary, '')));
"""


if HAS_SQLALCHEMY:

    Base = declarative_base()

    class PolicyFund(Base):
        """
        정책자금 공고 DB 모델.

        - notice_id: K-Startup 등 공고 고유 ID
        - roadmap_stage: 로드맵 단계 (JSON 배열)
        - required_documents_count: 필수 서류 개수
        - required_documents_list: 필수 서류 목록 (JSON 배열)
        """

        __tablename__ = "policy_funds"

        id = Column(Integer, primary_key=True, autoincrement=True)
        title = Column(Text, nullable=False)
        link = Column(Text)
        url = Column(Text)
        source_site = Column(String(64), default="K-STARTUP")
        notice_id = Column(String(64), unique=True)

        content_summary = Column(Text)
        region = Column(String(128))
        biz_age = Column(String(128))
        industry = Column(String(128))
        target_group = Column(String(128))
        support_type = Column(String(128))
        amount = Column(String(128))
        agency = Column(String(256))
        application_period = Column(String(256))
        application_method = Column(String(256))
        inquiry = Column(String(256))

        roadmap_stage = Column(JSONB, default=list)
        required_documents_count = Column(Integer, default=0)
        required_documents_list = Column(JSONB, default=list)

        raw_content = Column(Text)
        detail_content = Column(Text)

        created_at = Column(DateTime, default=datetime.utcnow)
        updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

        __table_args__ = (
            Index("idx_policy_notice_id", "notice_id"),
            Index("idx_policy_source", "source_site"),
            Index("idx_policy_region", "region"),
            Index("idx_policy_industry", "industry"),
            Index("idx_policy_docs_count", "required_documents_count"),
        )

        def to_dict(self) -> dict[str, Any]:
            """API 응답용 딕셔너리 변환"""
            return {
                "id": self.id,
                "title": self.title,
                "link": self.link,
                "url": self.url,
                "source_site": self.source_site,
                "notice_id": self.notice_id,
                "content_summary": self.content_summary,
                "region": self.region,
                "biz_age": self.biz_age,
                "industry": self.industry,
                "target_group": self.target_group,
                "support_type": self.support_type,
                "amount": self.amount,
                "agency": self.agency,
                "application_period": self.application_period,
                "application_method": self.application_method,
                "inquiry": self.inquiry,
                "roadmap_stage": self.roadmap_stage or [],
                "required_documents_count": self.required_documents_count or 0,
                "required_documents_list": self.required_documents_list or [],
                "created_at": self.created_at.isoformat() if self.created_at else None,
                "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            }


def get_supabase_migration_sql() -> str:
    """
    Supabase에서 실행할 마이그레이션 SQL 반환.

    기존 policy_funds 테이블에 새 컬럼만 추가하는 형태.
    """
    return """
-- policy_funds 테이블에 AI 파싱 컬럼 추가 (이미 있으면 스킵)
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS notice_id TEXT;
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS roadmap_stage JSONB DEFAULT '[]';
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS required_documents_count INTEGER DEFAULT 0;
ALTER TABLE policy_funds ADD COLUMN IF NOT EXISTS required_documents_list JSONB DEFAULT '[]';

-- 검색 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_policy_funds_notice_id ON policy_funds(notice_id);
CREATE INDEX IF NOT EXISTS idx_policy_funds_required_docs_count ON policy_funds(required_documents_count);
CREATE INDEX IF NOT EXISTS idx_policy_funds_roadmap_gin ON policy_funds USING GIN(roadmap_stage);
CREATE INDEX IF NOT EXISTS idx_policy_funds_docs_gin ON policy_funds USING GIN(required_documents_list);
"""
