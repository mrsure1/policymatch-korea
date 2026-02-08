"""
Supabase 데이터베이스 클라이언트

정책자금 메타데이터 저장 및 업데이트
"""

import os
from typing import Dict, List, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()


class SupabaseClient:
    """Supabase DB 연동 클라이언트"""
    
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        """
        Supabase 클라이언트 초기화
        
        Args:
            url: Supabase 프로젝트 URL (없으면 환경변수)
            key: Supabase API 키 (없으면 환경변수)
        """
        self.url = url or os.getenv('SUPABASE_URL')
        self.key = key or os.getenv('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL 또는 SUPABASE_KEY가 설정되지 않았습니다.")
        
        # Supabase 클라이언트 생성
        self.client: Client = create_client(self.url, self.key)
    
    def create_policy_table(self) -> bool:
        """
        policy_funds 테이블 생성 (DDL)
        
        주의: Supabase 대시보드에서 직접 실행 권장
        
        SQL:
        CREATE TABLE IF NOT EXISTS policy_funds (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
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
            updated_at TIMESTAMP DEFAULT NOW(),
            agency TEXT,
            application_period TEXT,
            application_method TEXT,
            inquiry TEXT
        );
        """
        print("⚠️  테이블 생성은 Supabase 대시보드에서 직접 실행해주세요.")
        return False
    
    def upsert_policy(self, policy_data: Dict) -> bool:
        """
        정책 데이터 삽입 또는 업데이트
        
        Args:
            policy_data: 정책 데이터 딕셔너리
            {
                'title': str,
                'link': str (optional),
                'source_site': str (optional),
                'content_summary': str (optional),
                'region': str (optional),
                'biz_age': str (optional),
                'industry': str (optional),
                'target_group': str (optional),
                'support_type': str (optional),
                'amount': str (optional),
                'raw_content': str (optional),
                'agency': str (optional),
                'application_period': str (optional),
                'application_method': str (optional),
                'inquiry': str (optional)
            }
            
        Returns:
            성공 여부
        """
        try:
            # upsert 수행 (title 기준으로 중복 확인)
            response = self.client.table('policy_funds') \
                .upsert(policy_data, on_conflict='title') \
                .execute()
            
            return True
            
        except Exception as e:
            print(f"❌ DB 저장 실패: {e}")
            return False
    
    def update_metadata(self, title: str, metadata: Dict) -> bool:
        """
        기존 정책의 메타데이터만 업데이트
        
        Args:
            title: 정책 제목 (검색 키)
            metadata: 업데이트할 메타데이터
            {
                'content_summary': str,
                'region': str,
                'biz_age': str,
                'industry': str,
                'target_group': str,
                'support_type': str,
                'amount': str
            }
            
        Returns:
            성공 여부
        """
        try:
            # 업데이트 수행
            response = self.client.table('policy_funds') \
                .update(metadata) \
                .eq('title', title) \
                .execute()
            
            return True
            
        except Exception as e:
            print(f"❌ 메타데이터 업데이트 실패: {e}")
            return False
    
    def get_policies_without_metadata(self, limit: int = 100) -> List[Dict]:
        """
        메타데이터가 없는 정책 조회
        
        Args:
            limit: 조회할 최대 개수
            
        Returns:
            정책 리스트
        """
        try:
            response = self.client.table('policy_funds') \
                .select('*') \
                .is_('region', 'null') \
                .limit(limit) \
                .execute()
            
            return response.data
            
        except Exception as e:
            print(f"❌ 조회 실패: {e}")
            return []
    
    def insert_batch(self, policies: List[Dict]) -> int:
        """
        여러 정책 데이터 일괄 삽입
        
        Args:
            policies: 정책 데이터 리스트
            
        Returns:
            성공한 개수
        """
        success_count = 0
        
        for policy in policies:
            if self.upsert_policy(policy):
                success_count += 1
        
        return success_count

    def get_existing_titles(self) -> List[str]:
        """
        이미 저장된 정책 제목 목록 조회
        
        Returns:
            제목 리스트
        """
        try:
            # 제목만 가져오기 (메타데이터와 링크가 모두 있는 것만)
            response = self.client.table('policy_funds') \
                .select('title') \
                .not_.is_('content_summary', 'null') \
                .not_.is_('link', 'null') \
                .execute()
            
            return [item['title'] for item in response.data]
            
        except Exception as e:
            print(f"❌ 기존 데이터 조회 실패: {e}")
            return []


# 테스트 코드
def test_supabase():
    """Supabase 연결 테스트"""
    try:
        client = SupabaseClient()
        print("✅ Supabase 연결 성공!")
        
        # 테스트 데이터
        test_policy = {
            'title': '테스트 정책',
            'link': 'https://test.com',
            'source_site': 'TEST',
            'content_summary': '테스트용 정책입니다.',
            'region': '전국',
            'industry': 'IT',
        }
        
        # 삽입 테스트
        if client.upsert_policy(test_policy):
            print("✅ 데이터 삽입 성공!")
        
    except Exception as e:
        print(f"❌ 연결 실패: {e}")


if __name__ == "__main__":
    test_supabase()
