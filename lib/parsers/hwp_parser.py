"""
HWP 파일 파서

olefile 라이브러리를 사용하여 HWP 5.0 이상 파일에서 텍스트 추출
"""

import os
import olefile
import zlib
import struct
from typing import Dict, Optional


class HWPParser:
    """HWP 파일 텍스트 추출기"""
    
    def __init__(self, file_path: str):
        """
        HWP 파서 초기화
        
        Args:
            file_path: HWP 파일 경로
        """
        self.file_path = file_path
        self.ole = None
        
    def extract_text(self) -> Dict:
        """
        HWP 파일에서 텍스트 추출
        
        Returns:
            {
                'title': str,
                'content': str,
                'success': bool,
                'error': str | None
            }
        """
        try:
            # OLE 파일 열기
            if not olefile.isOleFile(self.file_path):
                return {
                    'title': '',
                    'content': '',
                    'success': False,
                    'error': 'HWP 파일이 아닙니다.'
                }
            
            self.ole = olefile.OleFileIO(self.file_path)
            
            # 파일 정보 추출
            title = self._extract_title()
            
            # 본문 텍스트 추출
            content = self._extract_body_text()
            
            self.ole.close()
            
            if not content:
                return {
                    'title': title,
                    'content': '',
                    'success': False,
                    'error': '텍스트를 추출할 수 없습니다.'
                }
            
            return {
                'title': title,
                'content': content,
                'success': True,
                'error': None
            }
            
        except Exception as e:
            return {
                'title': '',
                'content': '',
                'success': False,
                'error': f'HWP 파싱 오류: {str(e)}'
            }
    
    def _extract_title(self) -> str:
        """HWP 파일 제목 추출"""
        try:
            # FileHeader 스트림에서 제목 추출 시도
            if self.ole.exists('\x05HwpSummaryInformation'):
                stream = self.ole.openstream('\x05HwpSummaryInformation')
                # Summary Information 파싱은 복잡하므로 파일명 사용
                return os.path.basename(self.file_path).replace('.hwp', '')
            else:
                return os.path.basename(self.file_path).replace('.hwp', '')
        except:
            return os.path.basename(self.file_path).replace('.hwp', '')
    
    def _extract_body_text(self) -> str:
        """HWP 본문 텍스트 추출"""
        text_parts = []
        
        try:
            # BodyText 섹션 찾기
            section_num = 0
            while True:
                section_name = f'BodyText/Section{section_num}'
                
                if not self.ole.exists(section_name):
                    break
                
                # 섹션 텍스트 추출
                section_text = self._extract_section_text(section_name)
                if section_text:
                    text_parts.append(section_text)
                
                section_num += 1
            
            return '\n\n'.join(text_parts)
            
        except Exception as e:
            print(f"⚠️  본문 추출 오류: {e}")
            return ''
    
    def _extract_section_text(self, section_name: str) -> str:
        """특정 섹션에서 텍스트 추출"""
        try:
            stream = self.ole.openstream(section_name)
            data = stream.read()
            
            # HWP 텍스트는 압축되어 있을 수 있음
            # 압축 해제 시도
            try:
                # zlib 압축 해제 시도
                decompressed = zlib.decompress(data, -15)
                data = decompressed
            except:
                # 압축이 안 되어 있으면 그냥 사용
                pass
            
            # 텍스트 추출 (간단한 방식 - 유니코드 문자만)
            text = self._parse_hwp_text(data)
            return text
            
        except Exception as e:
            print(f"⚠️  섹션 {section_name} 추출 오류: {e}")
            return ''
    
    def _parse_hwp_text(self, data: bytes) -> str:
        """
        HWP 바이너리 데이터에서 텍스트 파싱
        간단한 방식: 유니코드 문자만 추출
        """
        try:
            # UTF-16 LE로 디코딩 시도
            text = data.decode('utf-16le', errors='ignore')
            
            # 제어 문자 제거
            text = ''.join(char for char in text if char.isprintable() or char in '\n\r\t ')
            
            # 연속된 공백 정리
            import re
            text = re.sub(r'\s+', ' ', text)
            text = re.sub(r'\n\s+\n', '\n\n', text)
            
            return text.strip()
            
        except Exception as e:
            print(f"⚠️  텍스트 파싱 오류: {e}")
            return ''


def extract_text_from_hwp(file_path: str) -> Dict:
    """
    HWP 파일에서 텍스트 추출 (편의 함수)
    
    Args:
        file_path: HWP 파일 경로
        
    Returns:
        {
            'title': str,
            'content': str,
            'success': bool,
            'error': str | None
        }
    """
    parser = HWPParser(file_path)
    return parser.extract_text()


# 테스트 코드
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("사용법: python hwp_parser.py <HWP파일경로>")
        sys.exit(1)
    
    hwp_file = sys.argv[1]
    
    print(f"\n📄 HWP 파일 분석: {hwp_file}")
    print("="*70)
    
    result = extract_text_from_hwp(hwp_file)
    
    if result['success']:
        print(f"✅ 추출 성공!")
        print(f"\n제목: {result['title']}")
        print(f"\n내용 미리보기:\n{result['content'][:500]}...")
    else:
        print(f"❌ 추출 실패: {result['error']}")
