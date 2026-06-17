export const KSTARTUP_ONGOING_BASE =
    'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do'

export function isKStartupSource(url?: string | null, sourceSite?: string | null): boolean {
    const u = (url || '').toLowerCase()
    const s = (sourceSite || '').toUpperCase()
    return u.includes('k-startup.go.kr') || s.includes('K-STARTUP') || s === 'KSTARTUP'
}

export function isKStartupViewUrl(url?: string | null): boolean {
    if (!url) return false
    const lower = url.toLowerCase()
    return (
        lower.includes('k-startup.go.kr') &&
        (lower.includes('schm=view') || /pbancsn=\d+/i.test(lower)) &&
        !lower.includes('schm=list')
    )
}

/** K-Startup 목록 검색 URL (공고 상세 pbancSn 없음) */
export function isKStartupListSearchUrl(url?: string | null): boolean {
    if (!url) return false
    const lower = url.toLowerCase()
    return (
        lower.includes('k-startup.go.kr') &&
        lower.includes('schm=list') &&
        /[?&]schstr=/i.test(lower)
    )
}

/** K-Startup 현재 모집 목록에 있고 접수 마감 전인 공고인지 */
export function isActiveKStartupPolicy(policy: {
    url?: string | null
    sourcePlatform?: string | null
    dDay?: number | null
}): boolean {
    if (!isKStartupSource(policy.url, policy.sourcePlatform)) return true
    if (!isKStartupViewUrl(policy.url)) return false
    const dDay = policy.dDay
    if (dDay != null && dDay !== 999 && dDay < 0) return false
    return true
}

export function resolvePolicyCardHref(policy: {
    id: string
    url?: string | null
    mobileUrl?: string | null
}): { href: string; openInNewTab: boolean } {
    const mobile = (policy.mobileUrl || '').trim()
    if (mobile && (isKStartupViewUrl(mobile) || !mobile.includes('k-startup.go.kr'))) {
        return { href: mobile, openInNewTab: true }
    }

    const url = (policy.url || '').trim()
    if (url && isKStartupViewUrl(url)) {
        return { href: url, openInNewTab: true }
    }
    if (url && !url.includes('k-startup.go.kr')) {
        return { href: url, openInNewTab: true }
    }
    // K-Startup 검색 URL만 있으면 원문을 찾지 못할 수 있어 사이트 내 상세로 연결
    if (url && isKStartupListSearchUrl(url)) {
        return { href: `/policy/${policy.id}`, openInNewTab: false }
    }
    if (url) {
        return { href: url, openInNewTab: true }
    }
    return { href: `/policy/${policy.id}`, openInNewTab: false }
}

/** K-Startup 공고번호(pbancSn) — 보통 5자리 이상 */
export function isLikelyKStartupPbancId(id?: string | null): boolean {
    if (!id) return false
    return /^\d{5,9}$/.test(id.trim())
}

export function stripBrokenBrackets(text: string): string {
    let t = (text || '').trim()
    if (!t) return ''

    t = t.replace(/^[\(\[\{「【『<]+(?=[^\)\]\}」】』>]*(?:$|\s))/g, '')
    t = t.replace(/[\(\[\{「【『](?![^)\]\}」】』]*[\)\]\}」】』])/g, ' ')
    t = t.replace(/[^\uAC00-\uD7A3A-Za-z0-9\s「」『』【】\(\)\[\]\-·]/g, ' ')
    return t.replace(/\s+/g, ' ').trim()
}

const SEARCH_STOPWORDS = new Set([
    '공고', '모집', '안내', '사업', '지원', '대상', '신청', '접수', '예비', '년도', '년', '및', '관련', '운영',
    '모집공고', '사업공고', '시행계획', '선정', '신규', '신규글', '새글', '새로운게시글', '안내공고',
])

/** 제목 끝의 행정/절차성 단어만 제거 (핵심 명칭은 유지) */
const TRAILING_NOISE = /\s*(?:안내|모집(?:공고)?|공고|신청(?:서)?(?:\s*작성)?(?:\s*특강)?)\s*$/g

const QUOTED_PHRASE_REGEX =
    /(?:「([^」]+)」|『([^』]+)』|【([^】]+)】|\[([^\]]+)]|\(([^)]+)\)|"([^"]+)")/g

export function extractQuotedPhrases(title: string): string[] {
    const phrases: string[] = []
    let match: RegExpExecArray | null
    QUOTED_PHRASE_REGEX.lastIndex = 0
    while ((match = QUOTED_PHRASE_REGEX.exec(title)) !== null) {
        const phrase = (match[1] || match[2] || match[3] || match[4] || match[5] || match[6] || '').trim()
        if (phrase.length >= 4) phrases.push(phrase)
    }
    return phrases
}

export function isValidKStartupSearchTerm(term?: string | null): boolean {
    if (!term) return false
    const t = stripBrokenBrackets(term)
    if (t.length < 6) return false
    if (/^[\(\[\{「【『]/.test(t)) return false
    if (/^(공고|모집|안내|모집공고|\(공고)$/i.test(t)) return false
    if (/^20\d{0,2}$/.test(t)) return false
    if (/^[%][0-9A-F]{0,2}$/i.test(t)) return false
    // "사업설명회 모두의"처럼 의미 없는 조합
    if (/^사업설명회\s+모두의$/i.test(t)) return false
    if (/^모두의\s+사업설명회$/i.test(t)) return false

    const tokens = t
        .split(/\s+/)
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((x) => !SEARCH_STOPWORDS.has(x))

    const meaningful = tokens.join('').replace(/[^\uAC00-\uD7A3A-Za-z0-9]/g, '')
    return meaningful.length >= 4 && tokens.length >= 1
}

export function extractKStartupSearchTermFromUrl(url: string): string | undefined {
    const match = url.match(/[?&]schStr=([^&]+)/i)
    if (!match?.[1]) return undefined
    try {
        const decoded = decodeURIComponent(match[1].replace(/\+/g, ' ')).trim()
        return isValidKStartupSearchTerm(decoded) ? decoded : undefined
    } catch {
        return undefined
    }
}

export function parsePbancSnFromUrl(url?: string | null): string | undefined {
    if (!url) return undefined
    const goViewMatch = url.match(/go_view(?:_blank)?\((\d+)\)/i)
    if (goViewMatch?.[1]) return goViewMatch[1]
    const pbancMatch = url.match(/[?&]pbancSn=(\d+)/i)
    return pbancMatch?.[1]
}

export function buildKStartupViewUrl(pbancSn: string): string {
    return `${KSTARTUP_ONGOING_BASE}?schM=view&pbancSn=${pbancSn}`
}

export function buildKStartupListUrl(searchTerm?: string): string {
    if (searchTerm && isValidKStartupSearchTerm(searchTerm)) {
        return `${KSTARTUP_ONGOING_BASE}?schM=list&schStr=${encodeURIComponent(stripBrokenBrackets(searchTerm))}`
    }
    return `${KSTARTUP_ONGOING_BASE}?schM=list`
}

function normalizeTitleForSearch(title: string): string {
    return stripBrokenBrackets(title.replace(/<[^>]*>/g, ' '))
        .replace(/[「」『』【】\[\]()]/g, ' ')
        .replace(/\b20\d{2}\s*년도?\b/g, ' ')
        .replace(/\b20\d{2}\s*년\b/g, ' ')
        .replace(TRAILING_NOISE, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function extractRegionHint(title: string): string | undefined {
    const m = title.match(
        /(서울|경기|부산|대구|인천|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)(?:특별시|광역시|특별자치시|도|특별자치도)?(?:\s*지역)?/
    )
    return m?.[1]
}

function buildFullTitleCandidate(title: string): string | undefined {
    const normalized = normalizeTitleForSearch(title)
    if (!normalized || normalized.length < 8) return undefined
    const clipped = normalized.slice(0, 80).trim()
    return isValidKStartupSearchTerm(clipped) ? clipped : undefined
}

export function buildKStartupSearchCandidates(title?: string, existingSearch?: string): string[] {
    const raw = (title || '').replace(/<[^>]*>/g, ' ').trim()
    if (!raw) return []

    const quoted = extractQuotedPhrases(raw)
    const region = extractRegionHint(raw)
    const fullTitle = buildFullTitleCandidate(raw)

    const quotedVariants: string[] = []
    for (const phrase of quoted) {
        quotedVariants.push(phrase)
        if (region && !phrase.includes(region)) {
            quotedVariants.push(`${phrase} ${region}`)
        }
    }

    const validExisting =
        existingSearch && isValidKStartupSearchTerm(existingSearch)
            ? stripBrokenBrackets(existingSearch)
            : undefined

    const candidates = [
        ...quotedVariants,
        fullTitle,
        validExisting,
        quoted[0] && region ? `${quoted[0]} ${region}`.trim() : undefined,
    ]
        .filter((v): v is string => Boolean(v && v.trim()))
        .map((v) => stripBrokenBrackets(v))
        .filter((v) => isValidKStartupSearchTerm(v))

    return Array.from(new Set(candidates))
}

/**
 * K-Startup 공고 원문 URL (동기).
 * 1) numeric policyId(5자리+) → view  2) URL pbancSn  3) 유효 검색어  4) 목록
 */
export function resolveKStartupOfficialUrl(params: {
    rawUrl?: string | null
    title?: string | null
    sourceSite?: string | null
    policyId?: string | null
}): string | undefined {
    const { rawUrl, title, sourceSite, policyId } = params
    const isKStartup = isKStartupSource(rawUrl, sourceSite) || isLikelyKStartupPbancId(policyId)

    if (!isKStartup) {
        return rawUrl?.trim() || undefined
    }

    if (isLikelyKStartupPbancId(policyId)) {
        return buildKStartupViewUrl(policyId!.trim())
    }

    let url = (rawUrl || '').trim()
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
    }
    if (url.includes('/web/contents/bizpbanc-detail.do')) {
        url = url.replace('/web/contents/bizpbanc-detail.do', '/web/contents/bizpbanc-ongoing.do')
    }

    const pbancFromUrl = parsePbancSnFromUrl(url)
    if (pbancFromUrl) {
        return buildKStartupViewUrl(pbancFromUrl)
    }

    const existingSearch = url ? extractKStartupSearchTermFromUrl(url) : undefined
    const candidates = buildKStartupSearchCandidates(title || '', existingSearch)
    if (candidates.length > 0) {
        return buildKStartupListUrl(candidates[0])
    }

    return buildKStartupListUrl()
}
