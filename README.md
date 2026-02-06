# PolicyMatch Korea 🇰🇷

> 정부 정책자금 매칭 및 신청 가이드 웹 애플리케이션

## 프로젝트 개요

**PolicyMatch Korea**는 소상공인, 중소기업, 예비창업자를 위한 맞춤형 정부 지원 정책 매칭 서비스입니다.
복잡한 정부 지원 정책을 쉽게 찾고, 신청 절차를 단계별로 안내하며, 필요한 서류를 체계적으로 준비할 수 있도록 돕습니다.

### 핵심 기능

1. **스마트 매칭 시스템**
   - 사용자 프로필(업종, 지역, 사업기간 등)을 기반으로 적합한 정책 자동 매칭
   - 5단계 온보딩 프로세스로 간편한 프로필 작성

2. **신청 로드맵 (Action Roadmap)**
   - 정책 발견 후 실제 신청까지의 전 과정을 단계별로 안내
   - 각 단계별 예상 소요 기간 표시
   - 타임라인 UI로 직관적인 진행 상황 파악

3. **서류 준비 가이드 (Document Compass)**
   - 필수 서류와 우대/추가 서류를 명확히 구분
   - 각 서류의 발급처와 바로가기 링크 제공 (홈택스, 정부24 등)
   - 체크리스트 기능으로 준비 현황 추적

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **UI Components**: Custom components with Tailwind

## 프로젝트 구조

```
policymatch-korea/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 메인 대시보드 (매칭 결과)
│   ├── policy/
│   │   └── [id]/
│   │       └── page.tsx        # 정책 상세 페이지
│   └── globals.css             # 글로벌 스타일
├── components/
│   ├── OnboardingForm.tsx      # 5단계 온보딩 폼
│   ├── PolicyCard.tsx          # 정책 카드 컴포넌트
│   ├── RoadmapTimeline.tsx     # 신청 로드맵 타임라인
│   └── DocumentChecklist.tsx   # 서류 체크리스트
├── lib/
│   ├── mockPolicies.ts         # 정책 데이터 및 매칭 로직
│   ├── store.ts                # Zustand 스토어
│   └── utils.ts                # 유틸리티 함수
└── README.md
```

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
npm start
```

## API 설정 (선택사항)

### 공공데이터 API 연동

실제 정부 정책자금 데이터를 사용하려면 공공데이터포털 API 키가 필요합니다.

#### 1. API 키 발급

1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. **K-Startup 창업지원사업 공고 API** 검색 및 활용신청
3. 승인 후 **일반 인증키 (Encoding)** 복사

#### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_KEY=여기에_발급받은_API_키_입력
```

#### 3. 개발 서버 재시작

```bash
# 서버 중지 (Ctrl + C)
npm run dev
```

> **참고**: API 키 없이도 샘플 데이터로 모든 기능을 테스트할 수 있습니다.


## 주요 화면

### 1. 온보딩 (프로필 작성)

5단계 위저드 형식으로 사용자 정보를 수집합니다:
- Step 1: 사업자 유형 (예비창업자, 소상공인, 중소기업)
- Step 2: 연령대 (청년, 중장년, 시니어)
- Step 3: 사업장 지역 (서울, 경기 등)
- Step 4: 업종 (IT, 제조업, 서비스 등)
- Step 5: 사업 기간 (1년 미만, 3년 미만, 7년 이상)

### 2. 대시보드 (매칭 결과)

- 사용자 프로필 요약 표시
- 매칭된 정책 목록 (카드 형식)
- 각 정책의 D-Day, 지원 금액, 신청 기간 표시

### 3. 정책 상세 페이지

#### A. 정책 개요
- 지원 금액, 신청 기간, 담당 기관 등 핵심 정보

#### B. 신청 로드맵
- 단계별 신청 절차 안내
- 각 단계별 예상 소요 기간
- 타임라인 UI로 시각화

#### C. 서류 준비 가이드
- 필수 서류 / 우대·추가 서류 구분
- 각 서류의 발급처 및 바로가기 링크
- 체크박스로 준비 현황 추적
- 진행률 표시

## 데이터 구조

### 정책 데이터 (Policy)

```typescript
interface Policy {
  id: string;
  title: string;
  summary: string;
  supportAmount: string;
  dDay: number;
  applicationPeriod: string;
  agency: string;
  
  // 매칭 조건
  criteria: {
    entityTypes?: string[];
    ageGroups?: string[];
    regions?: string[];
    industries?: string[];
    businessPeriods?: string[];
  };
  
  // 신청 로드맵
  roadmap: PolicyRoadmapStep[];
  
  // 서류 가이드
  documents: PolicyDocument[];
}
```

### 현재 포함된 정책 (Mock Data)

1. **청년창업사관학교 (예비창업패키지)** - 최대 1억원
2. **소상공인 정책자금 (경영안정자금)** - 최대 7천만원
3. **경기도 중소기업 운전자금 지원** - 최대 3억원
4. **서울시 청년 소상공인 특별지원** - 최대 5천만원 (무이자)
5. **중소기업 기술개발 R&D 지원사업** - 최대 5억원

## 매칭 로직

사용자 프로필과 정책의 `criteria`를 비교하여 조건이 일치하는 정책만 필터링합니다.

```typescript
export function matchPolicies(profile: UserProfile): Policy[] {
  return mockPolicies.filter(policy => {
    // 사업자 유형, 연령대, 지역, 업종, 사업기간 등을 체크
    // 모든 조건이 일치하는 정책만 반환
  });
}
```

## UI/UX 디자인 가이드라인

### 색상 팔레트
- **Primary Blue**: `#2563EB` (신뢰감, 공공성)
- **Slate Gray**: 텍스트 및 보조 요소
- **Accent Colors**: 
  - Red (D-Day 긴급), Orange (D-Day 주의), Blue (D-Day 여유)
  - Green (체크리스트 완료)

### 반응형 디자인
- **Mobile First**: 모바일 화면에서 최적화된 UI
- **Breakpoints**: Tailwind 기본 breakpoints 사용
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px

### 타이포그래피
- 모든 텍스트는 **한글(Hangul)** 사용
- 제목: `font-bold`, `text-xl` ~ `text-2xl`
- 본문: `text-sm` ~ `text-base`

---

## 🤖 AI 정책 분석 시스템

### Gemini AI 자동 메타데이터 추출

**기능**: 정책 공고문을 AI로 분석하여 핵심 정보 자동 추출
- ✅ 지역, 업종, 지원금액, 대상 등 7가지 메타데이터 자동화
- ✅ HWP 파일 자동 파싱 (olefile 기반)
- ✅ Supabase PostgreSQL 자동 저장

### 사용법

```bash
# Python 의존성 설치
pip install -r requirements.txt

# 정책 데이터 분석 (API 데이터)
python scripts/analyze_policies.py --limit 10

# HWP 파일 분석
python scripts/analyze_policies.py --source hwp
```

### ⚠️ API 할당량 관리

Gemini API 무료 티어는 **하루 20개 제한**이 있습니다.

- ✅ 자동 Rate Limiting (10초 간격)
- ✅ 할당량 초과 시 자동 중단
- 📖 [자세한 가이드](docs/Gemini_API_할당량_가이드.md)

### 관련 문서

- [사용 가이드](docs/사용_가이드.md)
- [Gemini API 할당량 가이드](docs/Gemini_API_할당량_가이드.md)
- [Supabase 스키마 수정](docs/Supabase_스키마_수정_가이드.md)

---

## 향후 개선 사항

### 단기 (MVP 이후)
- [ ] 실제 공공데이터 API 연동 (공공데이터포털)
- [ ] 사용자 계정 시스템 (로그인/회원가입)
- [ ] 북마크 기능 (관심 정책 저장)
- [ ] 알림 기능 (마감일 D-7, D-1 알림)

### 중기
- [ ] AI 기반 사업계획서 작성 도우미
- [ ] 정책 신청 현황 추적 (진행 상태 관리)
- [ ] 커뮤니티 기능 (Q&A, 후기 공유)

### 장기
- [ ] 모바일 앱 (React Native)
- [ ] 지자체별 맞춤형 정책 추천
- [ ] 정책 신청 대행 서비스 연계

## 라이선스

MIT License

## 개발자

이 프로젝트는 한국의 소상공인과 중소기업을 돕기 위해 개발되었습니다.

---

**문의**: 정부 정책자금에 대한 더 자세한 정보는 [K-Startup](https://www.k-startup.go.kr) 또는 [소상공인시장진흥공단](https://www.semas.or.kr)을 참고하세요.
