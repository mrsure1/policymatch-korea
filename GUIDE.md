# PolicyMatch Korea - 프로젝트 가이드

## 🚀 빠른 시작

### 필수 요구사항
- **Node.js**: v20.9.0 이상 (현재 v18.20.8 사용 중 - 업그레이드 필요)
- **npm**: v8 이상

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저에서 확인
# http://localhost:3000
```

> ⚠️ **Node.js 버전 업그레이드 필요**
> 
> 현재 시스템의 Node.js 버전이 18.20.8입니다.
> Next.js 16은 Node.js 20.9.0 이상이 필요합니다.
> 
> **해결 방법:**
> 1. [Node.js 공식 사이트](https://nodejs.org)에서 LTS 버전(v20 이상) 다운로드
> 2. 또는 nvm 사용: `nvm install 20 && nvm use 20`

## 📁 프로젝트 구조

```
policymatch-korea/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # 루트 레이아웃 (한글 메타데이터)
│   ├── page.tsx               # 메인 대시보드
│   ├── policy/[id]/page.tsx   # 정책 상세 페이지
│   └── globals.css            # Tailwind 글로벌 스타일
│
├── components/                 # React 컴포넌트
│   ├── OnboardingForm.tsx     # 5단계 온보딩 위저드
│   ├── PolicyCard.tsx         # 정책 카드 (대시보드용)
│   ├── RoadmapTimeline.tsx    # 신청 로드맵 타임라인
│   └── DocumentChecklist.tsx  # 서류 체크리스트 (외부 링크 포함)
│
├── lib/                        # 유틸리티 및 데이터
│   ├── mockPolicies.ts        # 5개 정책 Mock 데이터 + 매칭 로직
│   ├── store.ts               # Zustand 스토어 (사용자 프로필)
│   └── utils.ts               # cn() 함수 (Tailwind 유틸)
│
└── README.md                   # 프로젝트 문서
```

## 🎯 주요 기능

### 1. 스마트 온보딩 (5단계)
- **Step 1**: 사업자 유형 선택
- **Step 2**: 연령대 선택
- **Step 3**: 사업장 지역 선택
- **Step 4**: 업종 선택
- **Step 5**: 사업 기간 선택

### 2. 정책 매칭 대시보드
- 사용자 프로필 기반 자동 매칭
- 매칭된 정책 카드 형식으로 표시
- D-Day, 지원 금액, 신청 기간 한눈에 확인

### 3. 정책 상세 페이지 (핵심!)

#### A. 신청 로드맵 (Action Roadmap)
- 단계별 신청 절차 타임라인
- 각 단계별 예상 소요 기간 표시
- 예시: "1. K-Startup 회원가입 (1일) → 2. 사업계획서 작성 (7일) → ..."

#### B. 서류 준비 가이드 (Document Compass)
- **필수 서류** vs **우대/추가 서류** 구분
- 각 서류의 발급처 명시 (예: 사업자등록증 → 홈택스)
- **바로가기 링크** 제공 (홈택스, 정부24, 특허청 등)
- 체크박스로 준비 현황 추적
- 진행률 표시 (예: 3/7 완료 - 43%)

## 📊 포함된 정책 데이터 (Mock)

1. **청년창업사관학교** - 최대 1억원 (예비창업자, 청년)
2. **소상공인 정책자금** - 최대 7천만원 (소상공인)
3. **경기도 운전자금 지원** - 최대 3억원 (경기 지역 중소기업)
4. **서울시 청년 소상공인 특별지원** - 최대 5천만원 무이자 (서울 청년)
5. **중소기업 R&D 지원** - 최대 5억원 (IT/제조업 중소기업)

각 정책은 다음을 포함합니다:
- 상세 로드맵 (5~7단계)
- 필수 서류 목록 (발급처 링크 포함)
- 매칭 조건 (업종, 지역, 연령대 등)

## 🎨 디자인 시스템

### 색상
- **Primary**: Blue #2563EB (신뢰감)
- **Accent**: Red (긴급), Orange (주의), Green (완료)
- **Neutral**: Slate Gray

### 반응형
- Mobile First 디자인
- Tailwind breakpoints 사용

## 🔧 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Icons**: Lucide React

## 📝 사용 예시

### 1. 온보딩 완료
```
사용자: 소상공인 / 청년 / 서울 / 서비스업 / 1년 미만
```

### 2. 매칭 결과
```
매칭된 정책 2개:
- 소상공인 정책자금
- 서울시 청년 소상공인 특별지원
```

### 3. 상세 페이지에서 확인
- 신청 로드맵: 6단계 (총 22일 소요)
- 필수 서류: 5개 (사업자등록증, 주민등록등본 등)
- 각 서류 발급처 바로가기 링크 제공

## 🚧 다음 단계 (실제 서비스화)

1. **Node.js 업그레이드** (v20 이상)
2. **개발 서버 실행** (`npm run dev`)
3. **공공데이터 API 연동** (실제 정책 데이터)
4. **사용자 인증** 추가
5. **배포** (Vercel 추천)

---

**개발 완료!** 🎉

프로젝트가 성공적으로 생성되었습니다.
Node.js를 v20 이상으로 업그레이드한 후 `npm run dev`로 실행하세요!
