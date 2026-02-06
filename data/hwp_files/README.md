# HWP 정책 파일 저장소

이 디렉토리는 정책자금 공고 HWP 파일을 저장하는 곳입니다.

## 사용 방법

1. 정책자금 공고 HWP 파일을 이 디렉토리에 저장
2. `scripts/analyze_policies.py` 실행 시 자동으로 파싱 및 분석

## 디렉토리 구조

```
hwp_files/
├── bizinfo/          # 기업마당 크롤링 HWP
├── k-startup/        # K-Startup 크롤링 HWP
└── manual/           # 수동으로 추가한 HWP
```

## 지원 형식

- HWP 5.0 이상
- 파일명은 자유롭게 지정 가능 (분석 시 자동 인식)
