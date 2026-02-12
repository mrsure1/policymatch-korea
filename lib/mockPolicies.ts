export interface UserProfile {
    entityType: '예비창업자' | '소상공인' | '중소기업' | '';
    age: '청년 (39세 이하)' | '중장년 (40-64세)' | '시니어 (65세 이상)' | '';
    region: string;
    industry: string;
    businessPeriod: '1년 미만' | '1-3년' | '3-7년' | '7년 이상' | '';
}

export type PolicyAgeGroup = UserProfile['age'] | '\uC804\uCCB4';


export interface PolicyRoadmapStep {
    step: number;
    title: string;
    description: string;
    estimatedDays?: number;
}

export interface PolicyDocument {
    name: string;
    category: '필수' | '우대/추가';
    whereToGet: string;
    link?: string;
    description?: string;  // 서류 설명 (예: "예비창업자의 경우 제출 x")
}

export interface Policy {
    id: string;
    title: string;
    summary: string;
    supportAmount: string;
    dDay: number;
    applicationPeriod: string;
    agency: string;
    sourcePlatform?: string;
    url?: string;
    mobileUrl?: string;
    detailContent?: string;
    inquiry?: string;
    applicationMethod?: string;

    // Matching criteria
    criteria: {
        entityTypes?: UserProfile['entityType'][];
        ageGroups?: PolicyAgeGroup[];
        regions?: string[];
        industries?: string[];
        businessPeriods?: UserProfile['businessPeriod'][];
    };

    // Action Roadmap
    roadmap: PolicyRoadmapStep[];

    // Document Compass
    documents: PolicyDocument[];
}

export const mockPolicies: Policy[] = [
    {
        id: 'policy-001',
        title: '청년창업사관학교 (예비창업패키지)',
        summary: '만 39세 이하 예비창업자를 대상으로 창업 아이디어 사업화를 지원하는 프로그램입니다. 사업화 자금 최대 1억원과 전문 멘토링을 제공합니다.',
        supportAmount: '최대 1억원',
        dDay: 15,
        applicationPeriod: '2026년 3월 1일 ~ 3월 31일',
        agency: '중소벤처기업부',
        sourcePlatform: 'K-Startup',

        criteria: {
            entityTypes: ['예비창업자'],
            ageGroups: ['청년 (39세 이하)'],
            industries: ['IT', '제조업', '서비스'],
        },

        roadmap: [
            {
                step: 1,
                title: 'K-Startup 회원가입',
                description: 'K-Startup 홈페이지에서 회원가입 및 본인인증을 완료합니다.',
                estimatedDays: 1,
            },
            {
                step: 2,
                title: '온라인 사업계획서 작성',
                description: '사업 아이디어, 시장분석, 수익모델 등을 포함한 사업계획서를 온라인으로 작성합니다.',
                estimatedDays: 7,
            },
            {
                step: 3,
                title: '서류 심사 대기',
                description: '제출된 사업계획서를 바탕으로 1차 서류심사가 진행됩니다.',
                estimatedDays: 14,
            },
            {
                step: 4,
                title: '발표 평가 (PT)',
                description: '서류 통과 시 사업 아이디어를 직접 발표하는 PT 평가에 참여합니다.',
                estimatedDays: 3,
            },
            {
                step: 5,
                title: '최종 선정 및 협약',
                description: '최종 선정 후 지원기관과 협약을 체결하고 자금을 수령합니다.',
                estimatedDays: 7,
            },
        ],

        documents: [
            {
                name: '주민등록등본',
                category: '필수',
                whereToGet: '정부24',
                link: 'https://www.gov.kr',
            },
            {
                name: '사업계획서',
                category: '필수',
                whereToGet: 'K-Startup 시스템 내 작성',
                link: 'https://www.k-startup.go.kr',
            },
            {
                name: '개인정보 수집·이용 동의서',
                category: '필수',
                whereToGet: 'K-Startup 다운로드',
                link: 'https://www.k-startup.go.kr',
            },
            {
                name: '재학증명서 (대학생인 경우)',
                category: '우대/추가',
                whereToGet: '소속 대학 행정실',
            },
            {
                name: '특허증 또는 지식재산권 증명서',
                category: '우대/추가',
                whereToGet: '특허청 (특허로)',
                link: 'https://www.patent.go.kr',
            },
        ],
    },

    {
        id: 'policy-002',
        title: '소상공인 정책자금 (경영안정자금)',
        summary: '매출 감소 등 경영 어려움을 겪는 소상공인에게 운전자금을 지원합니다. 최대 7천만원까지 저금리로 대출 가능합니다.',
        supportAmount: '최대 7천만원 (연 2.0%)',
        dDay: 45,
        applicationPeriod: '2026년 2월 1일 ~ 12월 31일 (상시)',
        agency: '소상공인시장진흥공단',
        sourcePlatform: '소상공인마당',

        criteria: {
            entityTypes: ['소상공인'],
            businessPeriods: ['1년 미만', '1-3년', '7년 이상'],
            industries: ['제조업', '서비스', '도소매'],
        },

        roadmap: [
            {
                step: 1,
                title: '기업마당 회원가입',
                description: '소상공인시장진흥공단 기업마당 홈페이지에서 회원가입을 완료합니다.',
                estimatedDays: 1,
            },
            {
                step: 2,
                title: '자가진단 시스템 이용',
                description: '온라인 자가진단을 통해 신청 자격 및 예상 대출한도를 확인합니다.',
                estimatedDays: 1,
            },
            {
                step: 3,
                title: '사전상담 예약',
                description: '가까운 지역센터에 방문 상담을 예약하거나 온라인 상담을 신청합니다.',
                estimatedDays: 3,
            },
            {
                step: 4,
                title: '온라인 신청서 작성',
                description: '필요 서류를 첨부하여 온라인으로 대출 신청서를 제출합니다.',
                estimatedDays: 2,
            },
            {
                step: 5,
                title: '현장실사 및 심사',
                description: '담당자가 사업장을 방문하여 실사를 진행하고, 신용평가 및 심사가 이루어집니다.',
                estimatedDays: 10,
            },
            {
                step: 6,
                title: '대출 실행',
                description: '심사 통과 후 대출 약정을 체결하고 자금이 입금됩니다.',
                estimatedDays: 5,
            },
        ],

        documents: [
            {
                name: '사업자등록증',
                category: '필수',
                whereToGet: '홈택스',
                link: 'https://www.hometax.go.kr',
            },
            {
                name: '법인등기부등본 (법인인 경우)',
                category: '필수',
                whereToGet: '대법원 인터넷등기소',
                link: 'https://www.iros.go.kr',
            },
            {
                name: '최근 3개월 매출 증빙 자료',
                category: '필수',
                whereToGet: '사업장 (카드매출전표, 세금계산서 등)',
            },
            {
                name: '재무제표 (최근 1년)',
                category: '필수',
                whereToGet: '세무사 또는 회계사',
            },
            {
                name: '임대차계약서',
                category: '필수',
                whereToGet: '사업장 (원본 지참)',
            },
            {
                name: '국세·지방세 완납증명서',
                category: '우대/추가',
                whereToGet: '홈택스 / 위택스',
                link: 'https://www.hometax.go.kr',
            },
        ],
    },

    {
        id: 'policy-003',
        title: '경기도 중소기업 운전자금 지원',
        summary: '경기도 소재 중소기업의 원활한 자금 운용을 위해 운전자금을 지원합니다. 최대 3억원까지 저금리 융자 가능합니다.',
        supportAmount: '최대 3억원 (연 1.5%)',
        dDay: 30,
        applicationPeriod: '2026년 3월 15일 ~ 6월 30일',
        agency: '경기도경제과학진흥원',
        sourcePlatform: '이지비즈',

        criteria: {
            entityTypes: ['중소기업'],
            regions: ['경기'],
            businessPeriods: ['1-3년', '7년 이상'],
        },

        roadmap: [
            {
                step: 1,
                title: '경기도경제과학진흥원 홈페이지 접속',
                description: '경기도경제과학진흥원 홈페이지에서 융자 공고를 확인하고 회원가입을 완료합니다.',
                estimatedDays: 1,
            },
            {
                step: 2,
                title: '신청자격 확인',
                description: '경기도 소재 여부, 업력, 매출액 등 신청자격 요건을 확인합니다.',
                estimatedDays: 1,
            },
            {
                step: 3,
                title: '온라인 신청서 제출',
                description: '필요 서류를 첨부하여 온라인으로 융자 신청서를 제출합니다.',
                estimatedDays: 3,
            },
            {
                step: 4,
                title: '서류 심사',
                description: '제출된 서류를 바탕으로 1차 서류심사가 진행됩니다.',
                estimatedDays: 7,
            },
            {
                step: 5,
                title: '현장 실사',
                description: '서류 통과 시 담당자가 사업장을 방문하여 실사를 진행합니다.',
                estimatedDays: 5,
            },
            {
                step: 6,
                title: '융자 심의위원회 심의',
                description: '융자 심의위원회에서 최종 승인 여부를 결정합니다.',
                estimatedDays: 10,
            },
            {
                step: 7,
                title: '약정 체결 및 자금 지급',
                description: '융자 약정을 체결하고 지정 계좌로 자금이 입금됩니다.',
                estimatedDays: 5,
            },
        ],

        documents: [
            {
                name: '사업자등록증',
                category: '필수',
                whereToGet: '홈택스',
                link: 'https://www.hometax.go.kr',
            },
            {
                name: '법인등기부등본',
                category: '필수',
                whereToGet: '대법원 인터넷등기소',
                link: 'https://www.iros.go.kr',
            },
            {
                name: '최근 3년 재무제표',
                category: '필수',
                whereToGet: '세무사 또는 회계사',
            },
            {
                name: '사업계획서',
                category: '필수',
                whereToGet: '자체 작성 (양식 다운로드)',
                link: 'https://www.gbsa.or.kr',
            },
            {
                name: '자금 사용 계획서',
                category: '필수',
                whereToGet: '자체 작성',
            },
            {
                name: '국세·지방세 완납증명서',
                category: '필수',
                whereToGet: '홈택스 / 위택스',
                link: 'https://www.hometax.go.kr',
            },
            {
                name: '4대 보험 가입 확인서',
                category: '우대/추가',
                whereToGet: '4대사회보험 정보연계센터',
                link: 'https://www.4insure.or.kr',
            },
            {
                name: '특허증 또는 인증서',
                category: '우대/추가',
                whereToGet: '특허청 / 인증기관',
            },
        ],
    },

    {
        id: 'policy-004',
        title: '서울시 청년 소상공인 특별지원',
        summary: '서울시 거주 만 39세 이하 청년 소상공인의 창업 및 경영 안정을 지원합니다. 최대 5천만원 무이자 대출 및 컨설팅 제공.',
        supportAmount: '최대 5천만원 (무이자)',
        dDay: 20,
        applicationPeriod: '2026년 4월 1일 ~ 5월 31일',
        agency: '서울산업진흥원',
        sourcePlatform: '서울기업지원센터',

        criteria: {
            entityTypes: ['소상공인'],
            ageGroups: ['청년 (39세 이하)'],
            regions: ['서울'],
            businessPeriods: ['1년 미만', '1-3년'],
        },

        roadmap: [
            {
                step: 1,
                title: '서울산업진흥원 홈페이지 회원가입',
                description: 'SBA 홈페이지에서 회원가입 및 본인인증을 완료합니다.',
                estimatedDays: 1,
            },
            {
                step: 2,
                title: '온라인 신청서 작성',
                description: '사업 현황, 자금 용도 등을 포함한 신청서를 작성합니다.',
                estimatedDays: 2,
            },
            {
                step: 3,
                title: '필수 서류 제출',
                description: '사업자등록증, 주민등록등본 등 필수 서류를 온라인으로 제출합니다.',
                estimatedDays: 2,
            },
            {
                step: 4,
                title: '서류 심사 및 현장 실사',
                description: '제출 서류 검토 후 사업장 현장 실사가 진행됩니다.',
                estimatedDays: 10,
            },
            {
                step: 5,
                title: '최종 선정 및 약정',
                description: '최종 선정 후 대출 약정을 체결하고 자금을 수령합니다.',
                estimatedDays: 7,
            },
            {
                step: 6,
                title: '사후 관리 (컨설팅)',
                description: '자금 지원 후 경영 컨설팅 및 교육 프로그램에 참여합니다.',
                estimatedDays: 90,
            },
        ],

        documents: [
            {
                name: '사업자등록증',
                category: '필수',
                whereToGet: '홈택스',
                link: 'https://www.hometax.go.kr',
            },
            {
                name: '주민등록등본',
                category: '필수',
                whereToGet: '정부24',
                link: 'https://www.gov.kr',
            },
            {
                name: '서울시 거주 증명 (주민등록등본)',
                category: '필수',
                whereToGet: '정부24',
                link: 'https://www.gov.kr',
            },
            {
                name: '최근 3개월 매출 증빙',
                category: '필수',
                whereToGet: '사업장 (카드매출전표 등)',
            },
            {
                name: '임대차계약서',
                category: '필수',
                whereToGet: '사업장 (원본)',
            },
            {
                name: '청년 확인서 (만 39세 이하)',
                category: '필수',
                whereToGet: '주민등록등본으로 대체',
            },
            {
                name: '우수 인증서 (예: 착한가격업소)',
                category: '우대/추가',
                whereToGet: '서울시 또는 자치구',
            },
        ],
    },

    {
        id: 'policy-005',
        title: '중소기업 기술개발 R&D 지원사업',
        summary: '기술 혁신형 중소기업의 R&D 활동을 지원하여 경쟁력을 강화합니다. 최대 5억원까지 개발비 지원.',
        supportAmount: '최대 5억원 (정부출연금)',
        dDay: 60,
        applicationPeriod: '2026년 2월 1일 ~ 4월 30일',
        agency: '중소벤처기업부 / 중소기업기술정보진흥원',
        sourcePlatform: 'SMTECH',

        criteria: {
            entityTypes: ['중소기업'],
            industries: ['IT', '제조업'],
            businessPeriods: ['1-3년', '7년 이상'],
        },

        roadmap: [
            {
                step: 1,
                title: 'SMTECH 회원가입',
                description: '중소기업기술정보진흥원(TIPA) SMTECH 시스템에 회원가입합니다.',
                estimatedDays: 1,
            },
            {
                step: 2,
                title: '기업 정보 등록',
                description: '사업자등록증, 재무제표 등 기업 정보를 시스템에 등록합니다.',
                estimatedDays: 2,
            },
            {
                step: 3,
                title: 'R&D 과제 기획서 작성',
                description: '개발 목표, 기술 내용, 예산 계획 등을 포함한 과제 기획서를 작성합니다.',
                estimatedDays: 14,
            },
            {
                step: 4,
                title: '온라인 신청서 제출',
                description: '작성한 기획서와 필수 서류를 첨부하여 온라인으로 제출합니다.',
                estimatedDays: 3,
            },
            {
                step: 5,
                title: '서류 평가',
                description: '제출된 과제의 기술성, 사업성, 실현 가능성 등을 평가합니다.',
                estimatedDays: 21,
            },
            {
                step: 6,
                title: '발표 평가 (PT)',
                description: '서류 통과 시 전문가 앞에서 과제를 발표하고 질의응답을 진행합니다.',
                estimatedDays: 7,
            },
            {
                step: 7,
                title: '최종 선정 및 협약',
                description: '최종 선정 후 협약을 체결하고 R&D 자금을 수령합니다.',
                estimatedDays: 14,
            },
        ],

        documents: [
            {
                name: '사업자등록증',
                category: '필수',
                whereToGet: '홈택스',
                link: 'https://www.hometax.go.kr',
            },
            {
                name: '법인등기부등본',
                category: '필수',
                whereToGet: '대법원 인터넷등기소',
                link: 'https://www.iros.go.kr',
            },
            {
                name: '최근 3년 재무제표',
                category: '필수',
                whereToGet: '세무사 또는 회계사',
            },
            {
                name: 'R&D 과제 기획서',
                category: '필수',
                whereToGet: 'SMTECH 시스템 내 작성',
                link: 'https://www.smtech.go.kr',
            },
            {
                name: '연구개발비 산출 내역서',
                category: '필수',
                whereToGet: '자체 작성 (양식 다운로드)',
            },
            {
                name: '기업부설연구소 인정서',
                category: '우대/추가',
                whereToGet: '한국산업기술진흥협회',
                link: 'https://www.koita.or.kr',
            },
            {
                name: '특허증 또는 지식재산권 증명',
                category: '우대/추가',
                whereToGet: '특허청',
                link: 'https://www.patent.go.kr',
            },
            {
                name: 'ISO 인증서',
                category: '우대/추가',
                whereToGet: '인증기관',
            },
        ],
    },
    {
        id: 'policy-2026-001',
        title: '2026 예비창업패키지',
        summary: '혁신적인 기술창업 아이디어를 보유한 예비창업자의 창업 사업화 준비단계를 지원하여 성공적인 창업시장 안착 유도. 사업화 자금 최대 1억원 지원.',
        supportAmount: '최대 1억원',
        dDay: 30,
        applicationPeriod: '2026년 3월 예정',
        agency: '중소벤처기업부 (창업진흥원)',
        sourcePlatform: 'K-Startup',
        criteria: {
            entityTypes: ['예비창업자'],
            ageGroups: [],
            regions: ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'],
            industries: ['IT', '제조업', '서비스', '도소매', '건설업', '음식업', '기타'],
            businessPeriods: [],
        },
        roadmap: [
            {
                step: 1,
                title: '사업 공고 확인',
                description: 'K-Startup 홈페이지를 통해 2026년 3월 공고 확인',
                estimatedDays: 1,
            },
            {
                step: 2,
                title: '사업계획서 작성',
                description: 'PSST 방식의 사업계획서 작성 및 증빙서류 준비',
                estimatedDays: 14,
            },
        ],
        documents: [],
    },
    {
        id: 'policy-2026-002',
        title: '2026 초기창업패키지',
        summary: '유망 창업 아이템 및 기술을 보유한 초기 창업기업(3년 이내)의 사업화 지원을 통한 안정적인 시장 진입 및 성장 도모.',
        supportAmount: '최대 1억원',
        dDay: 30,
        applicationPeriod: '2026년 2월 ~ 2026년 3월',
        agency: '중소벤처기업부 (창업진흥원)',
        sourcePlatform: 'K-Startup',
        criteria: {
            entityTypes: ['소상공인', '중소기업'],
            businessPeriods: ['1년 미만', '1-3년'],
            ageGroups: [],
        },
        roadmap: [],
        documents: [],
    },
    {
        id: 'policy-2026-003',
        title: '2026 창업도약패키지',
        summary: '도약기(3~7년) 기업의 사업모델 및 제품·서비스 고도화에 필요한 사업화 자금 지원으로 스케일업 촉진.',
        supportAmount: '최대 3억원',
        dDay: 30,
        applicationPeriod: '2026년 2월 ~ 2026년 3월',
        agency: '중소벤처기업부 (창업진흥원)',
        sourcePlatform: 'K-Startup',
        criteria: {
            entityTypes: ['중소기업'],
            businessPeriods: ['3-7년'],
            ageGroups: [],
        },
        roadmap: [],
        documents: [],
    },
    {
        id: 'policy-2026-008',
        title: '2026 청년창업사관학교',
        summary: '청년창업자를 대상으로 창업 전 과정(교육, 코칭, 공간, 자금, 기술 등)을 패키지로 지원.',
        supportAmount: '최대 1억원',
        dDay: 30,
        applicationPeriod: '2026년 2월 ~ 2026년 3월',
        agency: '중소벤처기업부 (중진공)',
        sourcePlatform: 'K-Startup',
        criteria: {
            entityTypes: ['예비창업자', '소상공인', '중소기업'],
            ageGroups: ['청년 (39세 이하)'],
            businessPeriods: ['1년 미만', '1-3년'],
        },
        roadmap: [],
        documents: [],
    },
    {
        id: 'policy-2026-004',
        title: '초격차 스타트업 프로젝트',
        summary: '시스템반도체, 바이오·헬스 등 신산업 분야 독보적 기술을 보유한 유망 스타트업 육성.',
        supportAmount: 'R&D 최대 6억 + 사업화 최대 2억',
        dDay: 15,
        applicationPeriod: '2026년 2월 말 마감',
        agency: '중소벤처기업부',
        sourcePlatform: 'K-Startup',
        criteria: {
            entityTypes: ['중소기업'],
            industries: ['IT', '제조업'],
            businessPeriods: ['3-7년', '7년 이상'],
            ageGroups: [],
        },
        roadmap: [],
        documents: [],
    },
];

// Matching function - Flexible matching logic
// Only checks criteria that are defined in the policy
// If a criterion is not defined in the policy, it's automatically considered a match
export function matchPolicies(profile: UserProfile): Policy[] {
    return mockPolicies.filter(policy => {
        const { criteria } = policy;

        // Entity type check - only if policy specifies entity types
        if (criteria.entityTypes && criteria.entityTypes.length > 0) {
            if (!profile.entityType || !criteria.entityTypes.includes(profile.entityType)) {
                return false;
            }
        }

        // Age group check - only if policy specifies age groups
        if (criteria.ageGroups && criteria.ageGroups.length > 0) {
            if (!profile.age || !criteria.ageGroups.includes(profile.age)) {
                return false;
            }
        }

        // Region check - only if policy specifies regions
        if (criteria.regions && criteria.regions.length > 0) {
            if (!profile.region || !criteria.regions.includes(profile.region)) {
                return false;
            }
        }

        // Industry check - only if policy specifies industries
        if (criteria.industries && criteria.industries.length > 0) {
            if (!profile.industry || !criteria.industries.includes(profile.industry)) {
                return false;
            }
        }

        // Business period check - only if policy specifies business periods
        if (criteria.businessPeriods && criteria.businessPeriods.length > 0) {
            if (!profile.businessPeriod || !criteria.businessPeriods.includes(profile.businessPeriod)) {
                return false;
            }
        }

        return true;
    });
}
