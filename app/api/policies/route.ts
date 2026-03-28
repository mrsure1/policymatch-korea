import { NextResponse } from 'next/server'
// Edge 런타임에서는 Node 전용 모듈을 사용할 수 없어 첨부파일 파싱은 비활성화
import { getSupabaseClient } from '@/lib/supabase/client'
import type { PolicyFundDB } from '@/lib/supabase/client'
import type { Policy, PolicyDocument, PolicyRoadmapStep } from '@/lib/mockPolicies'
export const runtime = 'edge'
export const revalidate = 7200

const CACHE_HEADERS: Record<string, string> = {
    'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'public, max-age=7200',
}

const RESPONSE_CACHE_TTL_MS = 2 * 60 * 60 * 1000
let responseCacheEntry: { data: string; headers: Record<string, string>; fetchedAt: number } | null = null

function cleanKStartupSearchTerm(title?: string): string {
    if (!title) return ''
    let cleaned = sanitizePolicyTitle(title)
    // Remove leading bracketed prefix like "[기관]" or "(기관)" or "【기관】" or "「기관」"
    cleaned = cleaned.replace(/^\s*(?:(?:\[[^\]]+\]|\([^)]+\)|【[^】]+】|「[^」]+」)\s*)+/g, '')
    cleaned = cleaned.replace(/\s*(?:\uC0C8\uB85C\uC6B4\uAC8C\uC2DC\uAE00|\uC0C8\s*\uAE00|\uC2E0\uADDC\s*\uAC8C\uC2DC\uAE00|\uC2E0\uADDC\s*\uAE00|NEW)\s*$/gi, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return cleaned
}

function extractCoreSearchPhrase(text: string): string | undefined {
    const normalized = cleanKStartupSearchTerm(text)
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\[[^\]]*]/g, ' ')
        .replace(/[「」『』【】<>]/g, ' ')
        .replace(/[~!@#$%^&*_=+|;:'",.?/\\-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    if (!normalized) return undefined

    const stopwords = new Set([
        '공고', '모집', '안내', '사업', '지원', '대상', '신청', '접수', '예비', '년도', '년', '및', '관련', '운영',
    ])
    const tokens = normalized
        .split(' ')
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => !stopwords.has(t))

    const priority = tokens.find((t) => /(사업|패키지|프로그램|바우처|아카데미|펀드|창업|재창업|수출)/.test(t) && t.length >= 4)
    if (priority) {
        const second = tokens.find((t) => t !== priority && t.length >= 2)
        return second ? `${priority} ${second}` : priority
    }

    const longToken = tokens.find((t) => t.length >= 4)
    if (longToken) {
        const second = tokens.find((t) => t !== longToken && t.length >= 2)
        return second ? `${longToken} ${second}` : longToken
    }
    return tokens.slice(0, 2).join(' ') || undefined
}

function buildKStartupSearchCandidates(title?: string, existingSearch?: string): string[] {
    const cleanedTitle = cleanKStartupSearchTerm(title || '')
    const cleanedExisting = cleanKStartupSearchTerm(existingSearch || '')
    const withoutParen = cleanedTitle
        .replace(/\([^)]*\)/g, ' ')
        .replace(/\[[^\]]*]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const stripped = withoutParen
        .replace(/\b20\d{2}\s*년도?\b/g, ' ')
        .replace(/\b20\d{2}\s*년\b/g, ' ')
        .replace(/\b(?:모집공고|모집\s*공고|모집|공고|시행계획|사업공고)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const core = extractCoreSearchPhrase(stripped || withoutParen || cleanedTitle || cleanedExisting)

    const candidates = [
        core,
        stripped,
        withoutParen,
        cleanedExisting,
        cleanedTitle,
    ].filter((v): v is string => Boolean(v && v.trim()))

    return Array.from(new Set(candidates.map((v) => v.trim())))
}

function extractAgencyFallback(title?: string, summary?: string): string | undefined {
    const t = (title || '').trim()
    const s = (summary || '').trim()

    // 1) Leading bracketed 기관명 in title
    const bracketMatch = t.match(/^\s*(?:\[([^\]]+)\]|\(([^)]+)\)|\u3010([^\u3011]+)\u3011|\u300C([^\u300D]+)\u300D)/)
    const fromTitle = bracketMatch?.[1] || bracketMatch?.[2] || bracketMatch?.[3] || bracketMatch?.[4]
    if (fromTitle) return fromTitle.trim()

    // 2) Summary pattern: "[프로그램] 기관명 | ..."
    const summaryMatch = s.match(/\]\s*([^|]+)\s*\|/)
    if (summaryMatch?.[1]) return summaryMatch[1].trim()

    return undefined
}

function inferSourcePlatformFromUrl(rawUrl?: string | null): string | undefined {
    if (!rawUrl) return undefined
    const url = rawUrl.toLowerCase()
    if (url.includes('k-startup.go.kr')) return 'K-Startup'
    if (url.includes('bizinfo.go.kr')) return '기업마당'
    if (url.includes('smtech.go.kr')) return 'SMTECH'
    if (url.includes('semas.or.kr') || url.includes('sbiz.or.kr')) return '소상공인마당'
    if (url.includes('gov24.go.kr') || url.includes('gov.kr')) return '정부24'
    return undefined
}

function normalizeSourceLabel(source?: string | null): string | undefined {
    if (!source) return undefined
    const upper = source.toUpperCase()
    if (upper === 'K-STARTUP' || upper === 'KSTARTUP') return 'K-Startup'
    if (upper === 'BIZINFO' || upper === '기업마당') return '기업마당'
    if (upper === 'SMTECH') return 'SMTECH'
    if (upper.includes('SEMAS') || upper.includes('SBIZ')) return '소상공인마당'
    if (upper === 'GOV24_API' || upper === 'GOV24') return '정부24'
    return source
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&#x27;/gi, "'")
        .replace(/&ldquo;|&rdquo;/gi, '"')
        .replace(/&lsquo;|&rsquo;/gi, "'")
}

function decodeXmlEntities(text: string): string {
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
}

function stripHtml(text?: string | null): string {
    if (!text) return ''
    const decodedFirst = decodeHtmlEntities(text)
    const withoutTags = decodedFirst
        .replace(/<[^>]*>/g, ' ')
        .replace(/<[^>]*$/g, ' ') // handle truncated tags
    const decodedAgain = decodeHtmlEntities(withoutTags)
    return decodedAgain.replace(/\s+/g, ' ').trim()
}

const SUMMARY_NOISE_PATTERN = /\b(\uC0C8\uB85C\uC6B4\uAC8C\uC2DC\uAE00|\uC0C8\s*\uAE00|\uC2E0\uADDC\s*\uAC8C\uC2DC\uAE00|NEW)\b/gi
const SUMMARY_GENERIC_PATTERN = /(\uC694\uC57D\s*\uC815\uBCF4\s*\uC5C6\uC74C|\uC694\uC57D\s*\uC815\uBCF4\uAC00\s*\uC5C6\uC2B5\uB2C8\uB2E4|\uC0C1\uC138\s*\uB0B4\uC6A9\s*\uCC38\uC870|\uB0B4\uC6A9\s*\uCC38\uC870|\uD648\uD398\uC774\uC9C0\s*\uCC38\uC870|\uACF5\uACE0\uBB38\s*\uCC38\uC870|\uBBF8\uC815|\uD574\uB2F9\s*\uC5C6\uC74C)/i
const SUMMARY_META_PATTERN = /\|\s*(?:\uB9C8\uAC10|\uB9C8\uAC10\uC77C|\uB9C8\uAC10\uC77C\uC790|\uC870\uD68C|\uC811\uC218|\uB4F1\uB85D|\uAE30\uAC04|\uACF5\uACE0\uC77C)\b/i
const SUMMARY_SKIP_PATTERN = /(\uACF5\uACE0\uBB38\s*\uCC38\uC870|\uD648\uD398\uC774\uC9C0\s*\uCC38\uC870|\uC790\uC138\uD55C\s*\uB0B4\uC6A9|\uC790\uC138\uD55C\s*\uC0AC\uD56D|\uC0C1\uC138\s*\uB0B4\uC6A9|\uBCF8\uBB38\s*\uCC38\uC870)/i
const SUMMARY_PLAN_ANNOUNCEMENT_PATTERN = /([^.!?]*(?:\uBAA8\uC9D1\uACC4\uD68D|\uBAA8\uC9D1\s*\uACF5\uACE0)[^.!?]*(?:\uB2E4\uC74C\uACFC\s*\uAC19\uC774\s*)?\uACF5\uACE0\uD569\uB2C8\uB2E4\.?)/i
const SUMMARY_KEYWORDS = [
    '\uBAA8\uC9D1',
    '\uC9C0\uC6D0',
    '\uB300\uC0C1',
    '\uD61C\uD0DD',
    '\uC790\uAE08',
    '\uAE30\uAC04',
    '\uC2E0\uCCAD',
    '\uC120\uC815',
    '\uD3C9\uAC00',
    '\uD504\uB85C\uADF8\uB7A8',
    '\uD328\uD0A4\uC9C0',
    '\uAD50\uC721',
    '\uBA58\uD1A0\uB9C1',
    '\uC0AC\uC5C5\uD654',
]

function cleanSummaryText(text: string): string {
    if (!text) return ''
    let cleaned = stripHtml(text)
    cleaned = cleaned.replace(SUMMARY_NOISE_PATTERN, ' ')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return cleaned
}

function isGenericSummary(text: string): boolean {
    if (!text) return true
    if (SUMMARY_GENERIC_PATTERN.test(text) && text.length <= 50) return true
    if (SUMMARY_META_PATTERN.test(text) && text.length <= 120) return true
    return false
}

function splitSummarySentences(text: string): string[] {
    if (!text) return []
    const normalized = text
        .replace(/([.!?])\s+/g, '$1\n')
        .replace(/(\uB2E4\.|\uB2C8\uB2E4\.|\uD569\uB2C8\uB2E4\.|\uB429\uB2C8\uB2E4\.|\uC788\uC2B5\uB2C8\uB2E4\.)\s+/g, '$1\n')
    return normalized
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
}

function extractSummaryFromContent(rawContent?: string | null, title?: string | null): string {
    if (!rawContent) return ''
    let text = stripHtml(rawContent)
    if (!text) return ''
    if (title) {
        text = text.replace(title, ' ')
    }
    text = text.replace(/\uACF5\uACE0\s*\uC81C?\s*\d{4}[-.]\d+\s*\uD638?/g, ' ')
    text = text.replace(SUMMARY_NOISE_PATTERN, ' ')
    text = text.replace(/\s+/g, ' ').trim()
    if (!text) return ''

    const planAnnouncementMatch = text.match(SUMMARY_PLAN_ANNOUNCEMENT_PATTERN)
    if (planAnnouncementMatch?.[1]) {
        const planText = cleanSummaryText(planAnnouncementMatch[1])
        if (planText.length > 20) return planText
    }

    const sentences = splitSummarySentences(text)
    const selected: string[] = []

    for (const sentence of sentences) {
        if (SUMMARY_SKIP_PATTERN.test(sentence)) continue
        if (sentence.length < 10) continue
        if (sentence.length > 220) continue
        if (SUMMARY_KEYWORDS.some((keyword) => sentence.includes(keyword))) {
            selected.push(sentence)
        }
        if (selected.length >= 3) break
    }

    if (selected.length === 0) {
        for (const sentence of sentences) {
            if (SUMMARY_SKIP_PATTERN.test(sentence)) continue
            if (sentence.length < 10) continue
            selected.push(sentence)
            if (selected.length >= 2) break
        }
    }

    return cleanSummaryText(selected.join('\n'))
}


function parseJsonValue(value: unknown): unknown {
    if (typeof value !== 'string') return value
    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}

function extractArrayFromObject(value: unknown, keys: string[]): unknown[] {
    if (!value || typeof value !== 'object') return []
    const obj = value as Record<string, unknown>
    for (const key of keys) {
        const candidate = obj[key]
        if (Array.isArray(candidate)) return candidate
    }
    return []
}

function splitTextItems(text: string): string[] {
    return text
        .split(/[\n\r\u2022\u00B7\-\*]+/g)
        .map((line) => line.trim())
        .filter(Boolean)
}

function normalizeRoadmap(value: unknown): PolicyRoadmapStep[] {
    const parsed = parseJsonValue(value)
    const arr = Array.isArray(parsed)
        ? parsed
        : extractArrayFromObject(parsed, ['steps', 'roadmap', 'items', 'process', 'procedures'])

    if (!arr.length && typeof parsed === 'string') {
        const items = splitTextItems(parsed)
        return items.map((title, index) => ({
            step: index + 1,
            title,
            description: '',
        }))
    }

    return arr
        .filter((item) => item && (typeof item === 'object' || typeof item === 'string'))
        .map((item, index) => {
            if (typeof item === 'string') {
                return { step: index + 1, title: item, description: '' }
            }
            const obj = item as Record<string, unknown>
            const title = obj.title ?? obj.name ?? obj.stepTitle ?? obj.label
            const description = obj.description ?? obj.desc ?? obj.detail
            const stepValue = Number(obj.step)
            return {
                step: Number.isFinite(stepValue) ? stepValue : index + 1,
                title: title ? String(title) : `\uB2E8\uACC4 ${index + 1}`,
                description: description ? String(description) : '',
                estimatedDays: obj.estimatedDays ? Number(obj.estimatedDays) : undefined,
            }
        })
}

function expandCommaSeparatedRoadmap(steps: PolicyRoadmapStep[]): PolicyRoadmapStep[] {
    if (steps.length !== 1) return steps
    const rawTitle = stripHtml(steps[0]?.title || '')
    if (!rawTitle) return steps
    if (!/[,\uFF0C]|\s+(?:및|그리고)\s+|[·ㆍ;\/]/.test(rawTitle)) return steps

    let text = rawTitle.split('※')[0]
    text = text.replace(/\([^)]*참조[^)]*\)/g, ' ')
    text = text.replace(/\s+/g, ' ').trim()
    if (!text) return steps

    const parts = text
        .split(/\s*(?:,|，|·|ㆍ|;|\/|및|그리고)\s*/g)
        .map((part) =>
            part
                .replace(/\(.*?\)/g, ' ')
                .replace(/\s*등.*$/g, '')
                .trim()
        )
        .filter(Boolean)

    if (parts.length <= 1) return steps

    return parts.slice(0, 12).map((title, index) => ({
        step: index + 1,
        title,
        description: '',
    }))
}

function normalizeDocumentCategory(value: unknown): '\uD544\uC218' | '\uC6B0\uB300/\uCD94\uAC00' {
    if (!value) return '\uD544\uC218'
    const raw = String(value)
    if (/\uC6B0\uB300|\uCD94\uAC00|\uC120\uD0DD|\uC635\uC158|\uCC38\uACE0/i.test(raw)) return '\uC6B0\uB300/\uCD94\uAC00'
    return '\uD544\uC218'
}

function normalizeDocuments(value: unknown): PolicyDocument[] {
    const parsed = parseJsonValue(value)

    const mapDocuments = (items: unknown[], defaultCategory: '\uD544\uC218' | '\uC6B0\uB300/\uCD94\uAC00') => {
        return items
            .map((item) => {
                if (!item) return null
                if (typeof item === 'string') {
                    return {
                        name: item,
                        category: defaultCategory,
                        whereToGet: '',
                    }
                }
                if (typeof item !== 'object') return null
                const obj = item as Record<string, unknown>
                const name = obj.name ?? obj.title ?? obj.document ?? obj.doc
                if (!name) return null
                return {
                    name: String(name),
                    category: normalizeDocumentCategory(obj.category ?? defaultCategory),
                    whereToGet: obj.whereToGet ? String(obj.whereToGet) : '',
                    link: obj.link ? String(obj.link) : undefined,
                }
            })
            .filter(Boolean) as PolicyDocument[]
    }

    if (Array.isArray(parsed)) {
        return mapDocuments(parsed, '\uD544\uC218')
    }

    if (typeof parsed === 'string') {
        const items = splitTextItems(parsed)
        return mapDocuments(items, '\uD544\uC218')
    }

    if (parsed && typeof parsed === 'object') {
        const required = extractArrayFromObject(parsed, [
            'required',
            'requiredDocs',
            'required_documents',
            'mandatory',
            'must',
        ])
        const optional = extractArrayFromObject(parsed, [
            'optional',
            'optionalDocs',
            'optional_documents',
            'recommended',
            'additional',
        ])
        const items = extractArrayFromObject(parsed, ['items', 'documents', 'documentList'])

        const merged = [
            ...mapDocuments(required, '\uD544\uC218'),
            ...mapDocuments(optional, '\uC6B0\uB300/\uCD94\uAC00'),
        ]
        if (merged.length > 0) return merged
        if (items.length > 0) return mapDocuments(items, '\uD544\uC218')
    }

    return []
}

const ROADMAP_SECTION_PATTERN = new RegExp(
    [
        '\\uB85C\\uB4DC\\uB9F5',
        '\\uC2E0\\uCCAD\\s*\\uC808\\uCC28',
        '\\uC120\\uC815\\s*\\uC808\\uCC28',
        '\\uD3C9\\uAC00\\s*\\uC808\\uCC28',
        '\\uC9C4\\uD589\\s*\\uC808\\uCC28',
        '\\uC9C4\\uD589\\s*\\uD504\\uB85C\\uC138\\uC2A4',
        '\\uD504\\uB85C\\uC138\\uC2A4',
    ].join('|'),
    'i'
)

const DOCUMENT_SECTION_PATTERN = new RegExp(
    [
        '\\uD544\\uC694\\s*\\uC11C\\uB958',
        '\\uC81C\\uCD9C\\s*\\uC11C\\uB958',
        '\\uAD6C\\uBE44\\s*\\uC11C\\uB958',
        '\\uC99D\\uBE59\\s*\\uC11C\\uB958',
        '\\uC2E0\\uCCAD\\s*\\uC11C\\uB958',
    ].join('|'),
    'i'
)

const SECTION_TITLE_PATTERN = /(?:\uC81C\uCD9C|\uC2E0\uCCAD|\uAD6C\uBE44|\uD544\uC218|\uD544\uC694|\uC99D\uBE59)\s*\uC11C\uB958/
const KOREAN_MARKER_REGEX = /^[가-힣][\.)]\s/

function cleanListItemLine(line: string): string {
    return line
        .replace(/^(?:\d+[\.)]|[-•·*])\s*/, '')
        .replace(KOREAN_MARKER_REGEX, '')
        .trim()
}

function isSectionTitleLine(line: string): boolean {
    return SECTION_TITLE_PATTERN.test(line) && !/\d+\s*\uBD80/.test(line)
}

function extractListItems(sectionHtml: string): string[] {
    const items: string[] = []
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let match: RegExpExecArray | null
    while ((match = liRegex.exec(sectionHtml)) !== null) {
        const raw = stripHtml(match[1])
        const cleaned = cleanListItemLine(raw)
        if (cleaned && !isSectionTitleLine(cleaned)) items.push(cleaned)
        if (items.length >= 12) break
    }
    if (items.length > 0) return items

    const text = stripHtml(sectionHtml)
    if (!text) return []
    return text
        .split(/[\n\r\u2022\u00B7\-\*]+/g)
        .map((line) => cleanListItemLine(line))
        .filter((line) => line && !isSectionTitleLine(line))
        .slice(0, 12)
}

function extractSectionItems(raw: string | null | undefined, pattern: RegExp): string[] {
    if (!raw) return []
    const html = decodeHtmlEntities(raw)
    const headingRegex = new RegExp(
        `<\\s*(?:h[1-6]|strong|b|p|th|td)[^>]*>[^<]*(?:${pattern.source})[^<]*<\\/\\s*(?:h[1-6]|strong|b|p|th|td)>`,
        'i'
    )
    const headingMatch = headingRegex.exec(html)
    if (headingMatch) {
        const start = headingMatch.index + headingMatch[0].length
        const tail = html.slice(start)
        const listMatch = tail.match(/<\s*(?:ul|ol)[^>]*>([\s\S]*?)<\/\s*(?:ul|ol)>/i)
        if (listMatch?.[1]) {
            const listItems = extractListItems(listMatch[1])
            if (listItems.length > 0) return listItems
        }
        const nextHeadingIndex = tail.search(/<\s*(?:h[1-6]|strong|b|th|td)\b[^>]*>|<\s*p\b[^>]*class=["'][^"']*(?:title|tit|sub|section)[^"']*["'][^>]*>/i)
        const sectionHtml = nextHeadingIndex >= 0 ? tail.slice(0, nextHeadingIndex) : tail
        const items = extractListItems(sectionHtml)
        if (items.length > 0) return items
    }

    const text = stripHtml(html)
    if (!pattern.test(text)) return []
    const idx = text.search(pattern)
    if (idx < 0) return []
    const tail = text.slice(idx)
    const lines = tail.split(/\n+/).map((line) => line.trim()).filter(Boolean)
    if (lines.length <= 1) return []
    const items = lines.slice(1)
        .map((line) => cleanListItemLine(line))
        .filter((line) => line && !pattern.test(line) && !isSectionTitleLine(line))
    return items.slice(0, 12)
}

function extractTitleFromHtml(text?: string | null): string | undefined {
    if (!text) return undefined
    const decoded = decodeHtmlEntities(text)
    const titleAttr = decoded.match(/title\s*=\s*["']([^"']+)["']/i)
    if (titleAttr?.[1]) {
        const candidate = stripHtml(titleAttr[1])
        if (candidate) return candidate
    }
    const stripped = stripHtml(decoded)
    return stripped || undefined
}

function sanitizePolicyTitle(raw?: string | null): string {
    if (!raw) return ''
    let cleaned = stripHtml(raw)
    if (!cleaned) return ''

    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    cleaned = cleaned.replace(/\b[가-힣A-Za-z]*\s*D-\d+\b/gi, '').replace(/\s+/g, ' ').trim()
    cleaned = cleaned.replace(/마감일자?\s*\d{4}[-.]\d{2}[-.]\d{2}/gi, '')
    cleaned = cleaned.replace(/\b조회\s*[\d,]+/gi, '')
    cleaned = cleaned.replace(/\b조회\b.*$/i, '')
    cleaned = cleaned.replace(/\d{4}[-.]\d{2}[-.]\d{2}/g, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    const primaryMatch = cleaned.match(/(.+?(?:공고|모집|안내|선정))/)
    if (primaryMatch?.[1]) return primaryMatch[1].trim()

    const supportMatch = cleaned.match(/(.+?지원(?:사업)?)/)
    if (supportMatch?.[1]) return supportMatch[1].trim()

    const half = Math.floor(cleaned.length / 2)
    if (half > 10 && cleaned.slice(0, half) === cleaned.slice(half)) {
        return cleaned.slice(0, half).trim()
    }

    return cleaned
}

function extractDatesFromText(text: string): Date[] {
    const dates: Date[] = []
    const fullDateRegex = /(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*(?:일)?(?:\s*\([^)]+\))?(?:\s*(\d{1,2})\s*[:시]\s*(\d{2})\s*분?)?/g
    let match: RegExpExecArray | null

    while ((match = fullDateRegex.exec(text)) !== null) {
        const year = Number(match[1])
        const month = Number(match[2])
        const day = Number(match[3])
        const hour = match[4] ? Number(match[4]) : 23
        const minute = match[5] ? Number(match[5]) : 59
        const utc = Date.UTC(year, month - 1, day, hour - 9, minute, 59)
        dates.push(new Date(utc))
    }

    // short date patterns (month/day) - use base year if found
    const yearMatch = text.match(/(20\d{2})\s*[.\-/년]/)
    const baseYear = yearMatch ? Number(yearMatch[1]) : new Date(Date.now() + 9 * 60 * 60 * 1000).getFullYear()
    const shortDateRegex = /(\d{1,2})\s*[./월]\s*(\d{1,2})\s*(?:일)?(?:\s*\([^)]+\))?(?:\s*(\d{1,2})\s*[:시]\s*(\d{2})\s*분?)?/g

    while ((match = shortDateRegex.exec(text)) !== null) {
        const month = Number(match[1])
        const day = Number(match[2])
        const hour = match[3] ? Number(match[3]) : 23
        const minute = match[4] ? Number(match[4]) : 59
        const utc = Date.UTC(baseYear, month - 1, day, hour - 9, minute, 59)
        dates.push(new Date(utc))
    }

    return dates
}

function formatDateKst(date: Date): string {
    const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    const year = kst.getUTCFullYear()
    const month = String(kst.getUTCMonth() + 1).padStart(2, '0')
    const day = String(kst.getUTCDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
}

const RANGE_SEPARATOR = /(?:~|\uFF5E|\u301C|\u223C|\u2212|-|\u2013|\u2014|\uBD80\uD130)/
const RANGE_REGEXES: RegExp[] = [
    new RegExp(`(\\d{4}[^~～〜∼]{0,40}\\d{1,2}[^~～〜∼]{0,40}\\d{1,2}[^~～〜∼]{0,20})\\s*${RANGE_SEPARATOR.source}\\s*(\\d{4}[^~～〜∼]{0,40}\\d{1,2}[^~～〜∼]{0,40}\\d{1,2}[^~～〜∼]{0,20})`, 'g'),
    new RegExp(`(\\d{4}[^~～〜∼]{0,40}\\d{1,2}[^~～〜∼]{0,40}\\d{1,2}[^~～〜∼]{0,20})\\s*${RANGE_SEPARATOR.source}\\s*(\\d{1,2}[^~～〜∼]{0,10}\\d{1,2}[^~～〜∼]{0,10})`, 'g'),
]

function findDateRangeInText(source: string): { start: Date; end: Date } | null {
    for (const regex of RANGE_REGEXES) {
        regex.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = regex.exec(source)) !== null) {
            const startText = match[1]
            let endText = match[2]
            const startDates = extractDatesFromText(startText)
            if (startDates.length === 0) continue
            const start = startDates[0]
            if (!/20\d{2}/.test(endText)) {
                const startYear = formatDateKst(start).slice(0, 4)
                endText = `${startYear} ${endText}`
            }
            const endDates = extractDatesFromText(endText)
            if (endDates.length === 0) continue
            const end = endDates[0]
            const spanDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            if (spanDays < 0 || spanDays > 370) continue
            return { start, end }
        }
    }
    return null
}

function findDeadlineDateInText(source: string): Date | null {
    const deadlinePatterns = [
        /(?:\uB9C8\uAC10\uC77C?|\uC811\uC218\s*\uB9C8\uAC10|\uC2E0\uCCAD\s*\uB9C8\uAC10)\s*[:：]?\s*(\d{4}\s*[.\-/\uB144]\s*\d{1,2}\s*[.\-/\uC6D4]\s*\d{1,2}\s*\uC77C?)/g,
        /(\d{4}\s*[.\-/\uB144]\s*\d{1,2}\s*[.\-/\uC6D4]\s*\d{1,2}\s*\uC77C?)\s*(?:\uAE4C\uC9C0|\uB9C8\uAC10)/g,
    ]
    for (const pattern of deadlinePatterns) {
        pattern.lastIndex = 0
        const match = pattern.exec(source)
        if (match?.[1]) {
            const dates = extractDatesFromText(match[1])
            if (dates.length > 0) return dates[0]
        }
    }
    return null
}

const APPLICATION_LABEL_HINTS = /(신청|접수|모집|공고|공모|지원|사업\s*공고)\s*(?:기간|일정|마감)[^0-9]{0,20}(.{0,200})/g

function extractDateRangeFromText(text: string): { start: Date; end: Date } | null {
    const normalized = text.replace(/\s+/g, ' ')

    let labelMatch: RegExpExecArray | null
    const labelRegex = new RegExp(APPLICATION_LABEL_HINTS.source, 'g')
    while ((labelMatch = labelRegex.exec(normalized)) !== null) {
        const segment = labelMatch[0]
        const range = findDateRangeInText(segment)
        if (range) return range
    }

    return findDateRangeInText(normalized)
}

function extractDateRangeFromLabeledSection(text: string): { start: Date; end: Date } | null {
    const normalized = text.replace(/\s+/g, ' ')
    const labelRegex = new RegExp(APPLICATION_LABEL_HINTS.source, 'g')
    let labelMatch: RegExpExecArray | null
    while ((labelMatch = labelRegex.exec(normalized)) !== null) {
        const segment = labelMatch[0]
        const range = findDateRangeInText(segment)
        if (range) return range
    }
    return null
}

const ALWAYS_OPEN_PATTERN = /(\uC0C1\uC2DC|\uC218\uC2DC|\uC608\uC0B0\s*\uC18C\uC9C4)/
const formatDateRange = (r: { start: Date; end: Date }) => `${formatDateKst(r.start)} ~ ${formatDateKst(r.end)}`

interface PreStrippedTexts {
    apText: string
    csText: string
    rcText: string
}

function preStripTexts(applicationPeriod?: string | null, contentSummary?: string | null, rawContent?: string | null): PreStrippedTexts {
    return {
        apText: applicationPeriod ? stripHtml(applicationPeriod) : '',
        csText: contentSummary ? stripHtml(contentSummary) : '',
        rcText: rawContent ? stripHtml(rawContent) : '',
    }
}

function computeApplicationPeriod(texts: PreStrippedTexts): string | null {
    const { apText, csText, rcText } = texts

    if (apText) {
        if (ALWAYS_OPEN_PATTERN.test(apText)) return '\uC0C1\uC2DC'
        const range = extractDateRangeFromText(apText)
        if (range) return formatDateRange(range)
    }
    if (csText) {
        if (ALWAYS_OPEN_PATTERN.test(csText)) return '\uC0C1\uC2DC'
        const range = extractDateRangeFromText(csText)
        if (range) return formatDateRange(range)
    }
    if (rcText) {
        const range = extractDateRangeFromLabeledSection(rcText)
        if (range) return formatDateRange(range)
        const deadline = findDeadlineDateInText(rcText)
        if (deadline) return `~ ${formatDateKst(deadline)}`
        if (ALWAYS_OPEN_PATTERN.test(rcText)) return '\uC0C1\uC2DC'
    }
    return null
}

function normalizeApplicationPeriodText(value?: string | null): string | null {
    if (!value) return null
    const text = stripHtml(value)
    if (!text) return null
    if (ALWAYS_OPEN_PATTERN.test(text)) return '\uC0C1\uC2DC'
    const range = extractDateRangeFromText(text)
    if (range) return formatDateRange(range)
    const deadline = findDeadlineDateInText(text)
    if (deadline) return `~ ${formatDateKst(deadline)}`
    return null
}

function computeDDayFromNormalizedPeriod(period?: string | null): number | null {
    if (!period) return null
    const text = stripHtml(period)
    if (!text) return null
    if (ALWAYS_OPEN_PATTERN.test(text)) return null
    const calcDiff = (d: Date) => Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const range = extractDateRangeFromText(text)
    if (range) return calcDiff(range.end)
    const deadlineMatch = text.match(/~\s*(\d{4}\.\d{2}\.\d{2})/)
    if (deadlineMatch?.[1]) {
        const dates = extractDatesFromText(deadlineMatch[1])
        if (dates.length > 0) return calcDiff(dates[0])
    }
    return null
}

function computeDDay(texts: PreStrippedTexts): number | null {
    const { apText, csText, rcText } = texts
    const calcDiff = (d: Date) => Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (apText) {
        const range = extractDateRangeFromText(apText)
        if (range) return calcDiff(range.end)
    }
    if (csText) {
        const range = extractDateRangeFromText(csText)
        if (range) return calcDiff(range.end)
    }
    if (rcText) {
        const range = extractDateRangeFromLabeledSection(rcText)
        if (range) return calcDiff(range.end)
        const deadline = findDeadlineDateInText(rcText)
        if (deadline) return calcDiff(deadline)
    }
    return null
}

function isMeaningfulApplicationPeriod(value?: string | null): boolean {
    return normalizeApplicationPeriodText(value) !== null
}

const META_CACHE_TTL_MS = 2 * 60 * 60 * 1000

interface MetaCacheEntry extends FetchMetaResult {
    fetchedAt: number
}

const metaCache = new Map<string, MetaCacheEntry>()

function shouldFetchDday(url?: string): boolean {
    if (!url) return false
    const u = url.toLowerCase()
    return (
        u.includes('k-startup.go.kr') ||
        u.includes('bizinfo.go.kr') ||
        u.includes('smtech.go.kr') ||
        u.includes('semas.or.kr') ||
        u.includes('sbiz.or.kr') ||
        u.includes('gov24.go.kr') ||
        u.includes('gov.kr')
    )
}

interface FetchMetaResult {
    dDay: number | null
    applicationPeriod: string | null
    roadmap: PolicyRoadmapStep[]
    documents: PolicyDocument[]
    resolvedUrl?: string
}

async function fetchMetaFromUrl(
    url: string,
    policyTitle?: string
): Promise<FetchMetaResult | null> {
    const cached = metaCache.get(url)
    if (cached && (Date.now() - cached.fetchedAt) < META_CACHE_TTL_MS) {
        return cached
    }
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
            },
            cache: 'no-store',
        })
        clearTimeout(timeoutId)
        if (!response.ok) return null
        const html = await response.text()
        let effectiveHtml = html
        let effectiveUrl = url

        const isKStartupSource = url.toLowerCase().includes('k-startup.go.kr')
        if (isKStartupSource && /go_view\(\d+\)/.test(html)) {
            const searchTerm = buildKStartupSearchCandidates(policyTitle || '', extractKStartupSearchTerm(url) || '')[0] || ''
            const resolvedId = extractKStartupPbancSn(html, searchTerm || policyTitle || '')
            if (resolvedId) {
                const detailUrl = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${resolvedId}`
                try {
                    const detailResponse = await fetch(detailUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
                        },
                        cache: 'no-store',
                    })
                    if (detailResponse.ok) {
                        effectiveHtml = await detailResponse.text()
                        effectiveUrl = detailUrl
                    }
                } catch {
                }
            }
        }

        const text = stripHtml(effectiveHtml)
        const fetchedTexts: PreStrippedTexts = { apText: text, csText: '', rcText: text }
        const applicationPeriod = computeApplicationPeriod(fetchedTexts)
        const dDay = computeDDay(fetchedTexts)
        const roadmapTitles = extractSectionItems(effectiveHtml, ROADMAP_SECTION_PATTERN)
        const documentNames = extractSectionItems(effectiveHtml, DOCUMENT_SECTION_PATTERN)
        let roadmap: PolicyRoadmapStep[] = roadmapTitles.map((title, index) => ({
            step: index + 1,
            title,
            description: '',
        }))
        let documents: PolicyDocument[] = documentNames.map((name) => ({
            name,
            category: '\uD544\uC218',
            whereToGet: '',
        }))

        const isBizinfo = effectiveUrl.toLowerCase().includes('bizinfo.go.kr')
        const isKStartup = effectiveUrl.toLowerCase().includes('k-startup.go.kr')
        if (isKStartup && documents.length === 0) {
            const fallbackDocs = extractKStartupSectionItems(effectiveHtml, '제출서류')
            documents = fallbackDocs.map((name) => ({
                name,
                category: '\uD544\uC218',
                whereToGet: '',
            }))
        }
        if (isKStartup && roadmap.length === 0) {
            const fallbackRoadmap = extractKStartupSectionItems(effectiveHtml, '선정절차')
            roadmap = fallbackRoadmap.map((title, index) => ({
                step: index + 1,
                title,
                description: '',
            }))
        }
        if (isKStartup && (documents.length === 0 || roadmap.length === 0 || effectiveUrl === url) && policyTitle) {
            const resolved = await fetchKStartupMetaByTitle(policyTitle)
            if (resolved) {
                if (documents.length === 0 && resolved.documents.length > 0) documents = resolved.documents
                if (roadmap.length === 0 && resolved.roadmap.length > 0) roadmap = resolved.roadmap
                if (resolved.resolvedUrl && effectiveUrl === url) effectiveUrl = resolved.resolvedUrl
            }
        }
        if ((roadmap.length === 0 || documents.length === 0) && isBizinfo) {
            const attachmentUrls = extractBizinfoAttachmentUrls(effectiveHtml).slice(0, 2)
            for (const attachmentUrl of attachmentUrls) {
                const extracted = await extractRoadmapDocumentsFromAttachmentUrl(attachmentUrl)
                if (roadmap.length === 0 && extracted.roadmap.length > 0) roadmap = extracted.roadmap
                if (documents.length === 0 && extracted.documents.length > 0) documents = extracted.documents
                if (roadmap.length > 0 && documents.length > 0) break
            }
        }
        if ((roadmap.length === 0 || documents.length === 0) && isKStartup) {
            const attachmentUrls = extractKStartupAttachmentUrls(effectiveHtml).slice(0, 2)
            for (const attachmentUrl of attachmentUrls) {
                const extracted = await extractRoadmapDocumentsFromAttachmentUrl(attachmentUrl)
                if (roadmap.length === 0 && extracted.roadmap.length > 0) roadmap = extracted.roadmap
                if (documents.length === 0 && extracted.documents.length > 0) documents = extracted.documents
                if (roadmap.length > 0 && documents.length > 0) break
            }
        }
        const resolvedUrl = effectiveUrl !== url ? effectiveUrl : undefined
        const result: FetchMetaResult = { dDay, applicationPeriod, roadmap, documents, resolvedUrl }
        const cacheEntry: MetaCacheEntry = { ...result, fetchedAt: Date.now() }
        metaCache.set(url, cacheEntry)
        return result
    } catch {
        return null
    }
}

function extractBizinfoAttachmentUrls(html: string): string[] {
    const decoded = decodeHtmlEntities(html)
    const matches = [...decoded.matchAll(/fileDown\.do\?atchFileId=([^&"']+)&fileSn=(\d+)/g)]
    const urls = matches.map((match) => new URL(`cmm/fms/${match[0]}`, 'https://www.bizinfo.go.kr/').toString())
    return Array.from(new Set(urls))
}

function extractKStartupAttachmentUrls(html: string): string[] {
    const decoded = decodeHtmlEntities(html)
    const urls: string[] = []

    const hrefMatches = [...decoded.matchAll(/href=["'](\/afile\/fileDownload\/[^"']+)["']/gi)]
    for (const match of hrefMatches) {
        try {
            urls.push(new URL(match[1], 'https://www.k-startup.go.kr').toString())
        } catch {
            // ignore
        }
    }

    const tokenMatches = [...decoded.matchAll(/fnPdfView\(['"]([^'"]+)['"]\)/gi)]
    for (const match of tokenMatches) {
        try {
            urls.push(new URL(`/afile/fileDownload/${match[1]}`, 'https://www.k-startup.go.kr').toString())
        } catch {
            // ignore
        }
    }

    return Array.from(new Set(urls))
}

function extractKStartupSectionItems(html: string, sectionTitle: string): string[] {
    const decoded = decodeHtmlEntities(html)
    const titleRegex = new RegExp(`<\\s*p[^>]*class=["']title["'][^>]*>\\s*${sectionTitle}\\s*<\\/\\s*p>`, 'i')
    const match = titleRegex.exec(decoded)
    if (!match) return []
    const start = match.index + match[0].length
    const tail = decoded.slice(start)
    const nextTitleIndex = tail.search(/<\\s*p[^>]*class=["']title["'][^>]*>/i)
    const sectionHtml = nextTitleIndex >= 0 ? tail.slice(0, nextTitleIndex) : tail
    const items = extractListItems(sectionHtml)
    return items.map((item) => item.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 12)
}

async function fetchKStartupMetaByTitle(title: string): Promise<{ roadmap: PolicyRoadmapStep[]; documents: PolicyDocument[]; resolvedUrl?: string } | null> {
    const searchTerms = buildKStartupSearchCandidates(title)
    if (searchTerms.length === 0) return null
    try {
        let detailUrl: string | null = null
        for (const searchTerm of searchTerms.slice(0, 4)) {
            const listUrl = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=list&schStr=${encodeURIComponent(searchTerm)}`
            const listResponse = await fetch(listUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
                },
                cache: 'no-store',
            })
            if (!listResponse.ok) continue
            const listHtml = await listResponse.text()
            const pbancSn = extractKStartupPbancSn(listHtml, title)
            if (!pbancSn) continue
            detailUrl = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${pbancSn}`
            break
        }
        if (!detailUrl) return null

        const detailResponse = await fetch(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
            },
            cache: 'no-store',
        })
        if (!detailResponse.ok) return null
        const detailHtml = await detailResponse.text()
        const roadmapTitles = extractSectionItems(detailHtml, ROADMAP_SECTION_PATTERN)
        const documentNames = extractSectionItems(detailHtml, DOCUMENT_SECTION_PATTERN)
        let roadmap: PolicyRoadmapStep[] = roadmapTitles.map((item, index) => ({
            step: index + 1,
            title: item,
            description: '',
        }))
        let documents: PolicyDocument[] = documentNames.map((name) => ({
            name,
            category: '\uD544\uC218',
            whereToGet: '',
        }))
        if (documents.length === 0) {
            documents = extractKStartupSectionItems(detailHtml, '제출서류').map((name) => ({
                name,
                category: '\uD544\uC218',
                whereToGet: '',
            }))
        }
        if (roadmap.length === 0) {
            roadmap = extractKStartupSectionItems(detailHtml, '선정절차').map((item, index) => ({
                step: index + 1,
                title: item,
                description: '',
            }))
        }
        return { roadmap, documents, resolvedUrl: detailUrl || undefined }
    } catch {
        return null
    }
}

function extractHwpxTextLines(xml: string): string[] {
    const lines: string[] = []
    const paraRegex = /<hp:p[\s\S]*?<\/hp:p>/gi
    let match: RegExpExecArray | null

    while ((match = paraRegex.exec(xml)) !== null) {
        const para = match[0]
        const texts = [...para.matchAll(/<hp:t>([\s\S]*?)<\/hp:t>/gi)].map((m) =>
            decodeXmlEntities(m[1]).replace(/<hp:fwSpace\s*\/?>/g, ' ')
        )
        const line = texts.join('').replace(/\s+/g, ' ').trim()
        if (line) lines.push(line)
    }

    return lines
}

function extractSectionLinesFromHwpx(lines: string[], headingRegexes: RegExp[], maxLines: number): string[] {
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i]
        if (headingRegexes.some((regex) => regex.test(line))) {
            return lines.slice(i + 1, i + 1 + maxLines)
        }
    }
    return []
}

function normalizeStepText(text: string): string {
    return text.replace(/\s+/g, ' ').trim()
}

function extractRoadmapFromHwpxLines(lines: string[]): PolicyRoadmapStep[] {
    const specificHeading = [
        /\d+[-\d]*\.\s*\uD3C9\uAC00\s*\uC808\uCC28/,
        /\d+[-\d]*\.\s*\uC2E0\uCCAD\s*\uC808\uCC28/,
        /\d+[-\d]*\.\s*\uC120\uC815\s*\uC808\uCC28/,
        /\d+[-\d]*\.\s*\uC9C4\uD589\s*\uC808\uCC28/,
    ]
    const generalHeading = [
        /\uD3C9\uAC00\s*\uC808\uCC28/,
        /\uC2E0\uCCAD\s*\uC808\uCC28/,
        /\uC120\uC815\s*\uC808\uCC28/,
        /\uC9C4\uD589\s*\uC808\uCC28/,
        /\uD504\uB85C\uC138\uC2A4/,
        /\uB85C\uB4DC\uB9F5/,
    ]

    let sectionLines: string[] = []

    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i]
        if (/^[*\u203B]/.test(line)) continue
        if (specificHeading.some((regex) => regex.test(line))) {
            sectionLines = lines.slice(i + 1, i + 1 + 120)
            break
        }
    }

    if (sectionLines.length === 0) {
        for (let i = lines.length - 1; i >= 0; i -= 1) {
            const line = lines[i]
            if (/^[*\u203B]/.test(line)) continue
            if (generalHeading.some((regex) => regex.test(line))) {
                sectionLines = lines.slice(i + 1, i + 1 + 120)
                break
            }
        }
    }

    if (sectionLines.length === 0) return []

    const steps: string[] = []
    let bucket: string[] = []

    const flush = () => {
        if (bucket.length === 0) return
        const merged = normalizeStepText(bucket.join(' '))
        if (merged) steps.push(merged)
        bucket = []
    }

    for (const line of sectionLines) {
        if (/^\s*\d+\.\s*\S/.test(line)) break
        if (/(?:\uAE30\uD0C0\s*\uC720\uC758\uC0AC\uD56D|\uBB38\uC758\uCC98|\uD3C9\uAC00\uAE30\uC900|\uAC10\uC810\uAE30\uC900|\uC81C\uCD9C\s*\uC11C\uB958|\uD544\uC694\s*\uC11C\uB958|\uAD6C\uBE44\s*\uC11C\uB958)/.test(line)) break
        if (/(\u21E8|\u2192|->)/.test(line)) {
            flush()
            continue
        }
        if (/^\d{2,4}\.\s*\d{1,2}\.\s*\d{1,2}/.test(line)) continue
        if (line.length <= 1) continue
        bucket.push(line)
    }
    flush()

    const cleaned = steps
        .map((step) => step.replace(/^[-\u2022\u00B7*\u25A1\u25A0\u3147\s]+/, '').trim())
        .filter(Boolean)

    if (cleaned.length === 0) return []

    return cleaned.slice(0, 12).map((title, index) => ({
        step: index + 1,
        title,
        description: '',
    }))
}

function extractDocumentsFromHwpxLines(lines: string[]): PolicyDocument[] {
    const sectionLines = extractSectionLinesFromHwpx(
        lines,
        [
            /^\s*\d+[-\d]*\.\s*(?:\uC81C\uCD9C|\uD544\uC694|\uAD6C\uBE44|\uC99D\uBE59|\uC2E0\uCCAD)\s*\uC11C\uB958/,
            /^\s*(?:\uC81C\uCD9C|\uD544\uC694|\uAD6C\uBE44|\uC99D\uBE59|\uC2E0\uCCAD)\s*\uC11C\uB958$/,
        ],
        180
    )
    if (sectionLines.length === 0) return []

    const docKeyword = /(\uC11C\uB958|\uD655\uC778\uC11C|\uC2E0\uCCAD\uC11C|\uACC4\uD68D\uC11C|\uC99D\uBE59|\uB3D9\uC758\uC11C|\uD655\uC57D\uC11C|\uBA85\uC138\uC11C|\uC591\uC2DD|\uC11C\uC2DD|\uB4F1\uB85D\uC99D|\uC99D\uBA85\uC11C|\uB4F1\uBCF8|\uC0AC\uBCF8|\uD1B5\uC7A5|\uCE74\uB4DC|\uC6D0\uBCF8|\uBD80\uBCF8)/
    const stopRegex = /^(?:\uC11C\uB958\uBA85|\uAD6C\uBD84|\uD56D\uBAA9|\uBE44\uACE0)$/i

    const items = sectionLines
        .map((line) => line.replace(/^[-\u2022\u00B7*\u25A1\u25A0\u3147\s]+/, '').trim())
        .filter((line) =>
            line &&
            line.length > 1 &&
            !stopRegex.test(line) &&
            !/^\u203B/.test(line) &&
            docKeyword.test(line)
        )

    const unique = Array.from(new Set(items))
    if (unique.length === 0) return []

    return unique.slice(0, 12).map((name) => ({
        name,
        category: '\uD544\uC218',
        whereToGet: '',
    }))
}

function extractSectionLinesFromText(text: string, headingRegexes: RegExp[], maxLines: number): string[] {
    const lines = text
        .split(/\r?\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i]
        if (headingRegexes.some((regex) => regex.test(line))) {
            return lines.slice(i + 1, i + 1 + maxLines)
        }
    }
    return []
}

function extractRoadmapFromPdfText(text: string): PolicyRoadmapStep[] {
    const sectionLines = extractSectionLinesFromText(
        text,
        [
            /\d+[-\d]*\.\s*\uD3C9\uAC00\s*\uC808\uCC28/,
            /\d+[-\d]*\.\s*\uC2E0\uCCAD\s*\uC808\uCC28/,
            /\d+[-\d]*\.\s*\uC120\uC815\s*\uC808\uCC28/,
            /\d+[-\d]*\.\s*\uC9C4\uD589\s*\uC808\uCC28/,
            /\uD3C9\uAC00\s*\uC808\uCC28/,
            /\uC2E0\uCCAD\s*\uC808\uCC28/,
            /\uC120\uC815\s*\uC808\uCC28/,
            /\uC9C4\uD589\s*\uC808\uCC28/,
            /\uB85C\uB4DC\uB9F5/,
            /\uD504\uB85C\uC138\uC2A4/,
        ],
        120
    )
    if (sectionLines.length === 0) return []

    const steps: string[] = []
    let bucket: string[] = []
    const flush = () => {
        if (bucket.length === 0) return
        const merged = normalizeStepText(bucket.join(' '))
        if (merged) steps.push(merged)
        bucket = []
    }

    for (const line of sectionLines) {
        if (/^\s*\d+\.\s*\S/.test(line)) break
        if (/(?:\uAE30\uD0C0\s*\uC720\uC758\uC0AC\uD56D|\uBB38\uC758\uCC98|\uD3C9\uAC00\uAE30\uC900|\uAC10\uC810\uAE30\uC900|\uC81C\uCD9C\s*\uC11C\uB958|\uD544\uC694\s*\uC11C\uB958|\uAD6C\uBE44\s*\uC11C\uB958)/.test(line)) break
        if (/(?:\u21E8|\u2192|->)/.test(line)) {
            flush()
            continue
        }
        if (/^\d{2,4}\.\s*\d{1,2}\.\s*\d{1,2}/.test(line)) continue
        if (line.length <= 1) continue
        bucket.push(line)
    }
    flush()

    const cleaned = steps
        .map((step) => step.replace(/^[-\u2022\u00B7*\u25A1\u25A0\u3147\s]+/, '').trim())
        .filter(Boolean)

    if (cleaned.length === 0) return []

    return cleaned.slice(0, 12).map((title, index) => ({
        step: index + 1,
        title,
        description: '',
    }))
}

function extractDocumentsFromPdfText(text: string): PolicyDocument[] {
    const sectionLines = extractSectionLinesFromText(
        text,
        [
            /^\s*\d+[-\d]*\.\s*(?:\uC81C\uCD9C|\uD544\uC694|\uAD6C\uBE44|\uC99D\uBE59|\uC2E0\uCCAD)\s*\uC11C\uB958/,
            /^\s*(?:\uC81C\uCD9C|\uD544\uC694|\uAD6C\uBE44|\uC99D\uBE59|\uC2E0\uCCAD)\s*\uC11C\uB958$/,
        ],
        160
    )
    if (sectionLines.length === 0) return []

    const docKeyword = /(\uC11C\uB958|\uD655\uC778\uC11C|\uC2E0\uCCAD\uC11C|\uACC4\uD68D\uC11C|\uC99D\uBE59|\uB3D9\uC758\uC11C|\uD655\uC57D\uC11C|\uBA85\uC138\uC11C|\uC591\uC2DD|\uC11C\uC2DD|\uB4F1\uB85D\uC99D|\uC99D\uBA85\uC11C|\uB4F1\uBCF8|\uC0AC\uBCF8|\uD1B5\uC7A5|\uCE74\uB4DC|\uC6D0\uBCF8|\uBD80\uBCF8)/
    const stopRegex = /^(?:\uC11C\uB958\uBA85|\uAD6C\uBD84|\uD56D\uBAA9|\uBE44\uACE0)$/i

    const items = sectionLines
        .map((line) => line.replace(/^[-\u2022\u00B7*\u25A1\u25A0\u3147\s]+/, '').trim())
        .filter((line) =>
            line &&
            line.length > 1 &&
            !stopRegex.test(line) &&
            !/^\u203B/.test(line) &&
            docKeyword.test(line)
        )

    const unique = Array.from(new Set(items))
    if (unique.length === 0) return []

    return unique.slice(0, 12).map((name) => ({
        name,
        category: '\uD544\uC218',
        whereToGet: '',
    }))
}

async function extractRoadmapDocumentsFromAttachmentUrl(_url: string): Promise<{ roadmap: PolicyRoadmapStep[]; documents: PolicyDocument[] }> {
    // Edge 런타임에서는 PDF/HWPX 파서가 동작하지 않아 첨부파일 파싱은 건너뜁니다.
    return { roadmap: [], documents: [] }
}

async function mapWithLimit<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length)
    let index = 0

    async function worker() {
        while (index < items.length) {
            const current = index++
            results[current] = await mapper(items[current], current)
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
    await Promise.all(workers)
    return results
}

function isKStartupPolicy(policy: Policy): boolean {
    const url = (policy.url || '').toLowerCase()
    const source = (policy.sourcePlatform || '').toLowerCase()
    return url.includes('k-startup.go.kr') || source.includes('k-startup')
}

function isKStartupViewUrl(url?: string | null): boolean {
    if (!url) return false
    const lower = url.toLowerCase()
    return lower.includes('k-startup.go.kr') && (lower.includes('schm=view') || /pbancsn=\d+/.test(lower)) && !lower.includes('schm=list')
}

function normalizeTitleKey(title: string): string {
    return sanitizePolicyTitle(title).toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeKStartupUrl(
    rawUrl: string | null | undefined,
    title: string,
    sourceSite: string | null | undefined
): string | undefined {
    if (!rawUrl) return rawUrl || undefined
    let url = rawUrl.trim()
    const isKStartup = url.includes('k-startup.go.kr') || sourceSite === 'K-STARTUP'
    if (!isKStartup) return url

    const base = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do'
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
    }
    if (url.includes('/web/contents/bizpbanc-detail.do')) {
        url = url.replace('/web/contents/bizpbanc-detail.do', '/web/contents/bizpbanc-ongoing.do')
    }

    const goViewMatch = url.match(/go_view(?:_blank)?\((\d+)\)/i)
    if (goViewMatch?.[1]) {
        return `${base}?schM=view&pbancSn=${goViewMatch[1]}`
    }

    const pbancMatch = url.match(/pbancSn=(\d+)/)
    const pbancSn = pbancMatch?.[1]
    if (pbancSn) {
        return `${base}?schM=view&pbancSn=${pbancSn}`
    }
    const existingSearch = extractKStartupSearchTerm(url)
    const searchTerm = buildKStartupSearchCandidates(title, existingSearch)[0]
    if (searchTerm) {
        return `${base}?schM=list&schStr=${encodeURIComponent(searchTerm)}`
    }

    return url || base
}

function normalizeForMatch(text: string): string {
    return stripHtml(text)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^0-9a-z\uAC00-\uD7A3]/gi, '')
}

function tokenizeForMatch(text: string): string[] {
    return stripHtml(text)
        .toLowerCase()
        .replace(/[^0-9a-z\uAC00-\uD7A3\s]/gi, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
}

function extractKStartupSearchTerm(url: string): string | undefined {
    const match = url.match(/[?&]schStr=([^&]+)/)
    if (!match?.[1]) return undefined
    try {
        return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim()
    } catch {
        return match[1]
    }
}

function extractKStartupPbancSn(html: string, title: string): string | undefined {
    const candidates = buildKStartupSearchCandidates(title)
    const normalizedCandidates = candidates.map((c) => normalizeForMatch(c)).filter(Boolean)
    const tokenCandidates = candidates.map((c) => tokenizeForMatch(c)).filter((tokens) => tokens.length > 0)
    const matches: Array<{ id: string; index: number }> = []
    const goViewRegex = /go_view(?:_blank)?\((\d+)\)/g
    let match: RegExpExecArray | null

    while ((match = goViewRegex.exec(html)) !== null) {
        matches.push({ id: match[1], index: match.index })
        if (matches.length > 50) break
    }

    if (matches.length === 0) {
        const pbancRegex = /pbancSn=(\d+)/g
        while ((match = pbancRegex.exec(html)) !== null) {
            matches.push({ id: match[1], index: match.index })
            if (matches.length > 50) break
        }
    }

    if (matches.length === 0) {
        const pbancMatch = html.match(/pbancSn=(\d+)/)
        return pbancMatch?.[1]
    }

    // Avoid linking to an unrelated first result when title matching is not reliable.
    if (normalizedCandidates.length === 0) return undefined

    let bestByTokenOverlap: { id: string; score: number } | undefined

    for (const item of matches) {
        const window = html.slice(item.index, item.index + 800)
        const titleAttr = window.match(/title=["']([^"']+)["']/i)
        const textMatch = window.match(/>([^<]{6,})</)
        const candidateRaw = titleAttr?.[1] || textMatch?.[1]
        if (!candidateRaw) continue
        const candidate = normalizeForMatch(candidateRaw)
        if (!candidate) continue
        if (normalizedCandidates.some((needle) => candidate.includes(needle) || needle.includes(candidate))) {
            return item.id
        }
        const candidateTokens = new Set(tokenizeForMatch(candidateRaw))
        const overlapScore = tokenCandidates.reduce((best, tokens) => {
            const overlap = tokens.filter((token) => candidateTokens.has(token)).length
            return Math.max(best, overlap)
        }, 0)
        const hasTokenMatch = tokenCandidates.some((tokens) => overlapScore >= Math.min(2, tokens.length))
        if (hasTokenMatch) {
            return item.id
        }
        if (!bestByTokenOverlap || overlapScore > bestByTokenOverlap.score) {
            bestByTokenOverlap = { id: item.id, score: overlapScore }
        }
    }

    if (matches.length === 1) return matches[0].id
    if (bestByTokenOverlap && bestByTokenOverlap.score >= 1) {
        return bestByTokenOverlap.id
    }

    return undefined
}

function extractKStartupPbancFromUrl(url?: string | null): string | undefined {
    if (!url) return undefined
    const match = url.match(/[?&]pbancSn=(\d+)/i)
    return match?.[1]
}

async function resolveKStartupDetailUrl(
    rawUrl: string | null | undefined,
    title: string,
    sourceSite: string | null | undefined
): Promise<string | undefined> {
    if (!rawUrl) return rawUrl || undefined
    let url = rawUrl.trim()
    const isKStartup = url.includes('k-startup.go.kr') || sourceSite === 'K-STARTUP'
    if (!isKStartup) return url

    const base = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do'
    if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
    }
    if (url.includes('/web/contents/bizpbanc-detail.do')) {
        url = url.replace('/web/contents/bizpbanc-detail.do', '/web/contents/bizpbanc-ongoing.do')
    }

    const goViewMatch = url.match(/go_view(?:_blank)?\((\d+)\)/i)
    if (goViewMatch?.[1]) {
        return `${base}?schM=view&pbancSn=${goViewMatch[1]}`
    }

    const pbancMatch = url.match(/pbancSn=(\d+)/)
    const pbancSn = pbancMatch?.[1]
    if (pbancSn) {
        return `${base}?schM=view&pbancSn=${pbancSn}`
    }

    const existingSearch = extractKStartupSearchTerm(url)
    const candidates = buildKStartupSearchCandidates(title, existingSearch)
    const fallbackUrl = candidates[0]
        ? `${base}?schM=list&schStr=${encodeURIComponent(candidates[0])}`
        : (url || base)

    if (candidates.length === 0) return fallbackUrl

    try {
        for (const searchTerm of candidates.slice(0, 4)) {
            const searchUrl = `${base}?schM=list&schStr=${encodeURIComponent(searchTerm)}`
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            const response = await fetch(searchUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
                },
            })
            clearTimeout(timeoutId)
            if (!response.ok) continue
            const html = await response.text()
            const resolvedId = extractKStartupPbancSn(html, title)
            if (resolvedId) {
                return `${base}?schM=view&pbancSn=${resolvedId}`
            }
        }
    } catch {
        return fallbackUrl
    }

    return fallbackUrl
}

// DB 데이터 → UI 타입 변환
function mapDBToUI(dbPolicy: PolicyFundDB): Policy {
    const sourceFromUrl = inferSourcePlatformFromUrl(dbPolicy.link || dbPolicy.url)
    const sourceFromSite = normalizeSourceLabel(dbPolicy.source_site)
    const sourcePlatform = sourceFromUrl || sourceFromSite
    const cleanedTitle = sanitizePolicyTitle(extractTitleFromHtml(dbPolicy.title) || stripHtml(dbPolicy.title))
    const cleanedSummary = cleanSummaryText(dbPolicy.content_summary || '')
    const summaryFallback = isGenericSummary(cleanedSummary) ? extractSummaryFromContent(dbPolicy.raw_content, cleanedTitle) : cleanedSummary
    const texts = preStripTexts(dbPolicy.application_period, dbPolicy.content_summary, dbPolicy.raw_content)
    const cleanedPeriod = texts.apText
    const computedPeriod = computeApplicationPeriod(texts)
    const computedDDayRaw = computeDDay(texts)
    const computedDDay = Number.isFinite(computedDDayRaw) ? computedDDayRaw : null
    const finalPeriod = normalizeApplicationPeriodText(computedPeriod) || normalizeApplicationPeriodText(cleanedPeriod) || '\uC0C1\uC2DC'
    const syncedDDay = computeDDayFromNormalizedPeriod(finalPeriod)
    const dbDdayRaw = typeof dbPolicy.d_day === 'number' && Number.isFinite(dbPolicy.d_day) ? dbPolicy.d_day : null
    const dbDday = (dbDdayRaw !== null && dbDdayRaw >= -30 && dbDdayRaw <= 370) ? dbDdayRaw : null
    const normalizedRoadmap: PolicyRoadmapStep[] = normalizeRoadmap(dbPolicy.roadmap)
    const normalizedDocuments: PolicyDocument[] = normalizeDocuments(dbPolicy.documents)
    const roadmapFallback: PolicyRoadmapStep[] = normalizedRoadmap.length > 0
        ? normalizedRoadmap
        : extractSectionItems(dbPolicy.raw_content, ROADMAP_SECTION_PATTERN).map((title, index): PolicyRoadmapStep => ({
            step: index + 1,
            title,
            description: '',
        }))
    const expandedRoadmap = expandCommaSeparatedRoadmap(roadmapFallback)
    const documentsFallback: PolicyDocument[] = normalizedDocuments.length > 0
        ? normalizedDocuments
        : extractSectionItems(dbPolicy.raw_content, DOCUMENT_SECTION_PATTERN).map((name): PolicyDocument => ({
            name,
            category: '\uD544\uC218',
            whereToGet: '',
        }))
    return {
        id: String(dbPolicy.id), // 숫자 ID를 문자열로 변환
        title: cleanedTitle || '제목 없음',
        summary: summaryFallback || '',
        supportAmount: dbPolicy.amount || '미정',
        dDay: syncedDDay ?? computedDDay ?? dbDday ?? 999,
        applicationPeriod: finalPeriod,
        agency: dbPolicy.agency || extractAgencyFallback(cleanedTitle, cleanedSummary) || sourcePlatform || '정부기관',
        sourcePlatform,
        url: normalizeKStartupUrl(dbPolicy.link || dbPolicy.url || undefined, dbPolicy.title, dbPolicy.source_site),
        mobileUrl: dbPolicy.mobile_url || undefined,
        detailContent: dbPolicy.raw_content || undefined,
        inquiry: dbPolicy.inquiry || undefined,
        applicationMethod: dbPolicy.application_method || undefined,

        criteria: {
            entityTypes: (dbPolicy.criteria?.entityTypes || []) as any,
            ageGroups: (dbPolicy.criteria?.ageGroups || []) as any,
            regions: dbPolicy.criteria?.regions || (dbPolicy.region ? [dbPolicy.region] : []),
            industries: dbPolicy.criteria?.industries || (dbPolicy.industry ? dbPolicy.industry.split(',').map((s: string) => s.trim()) : []),
            businessPeriods: (dbPolicy.criteria?.businessPeriods || (dbPolicy.biz_age ? [dbPolicy.biz_age] : [])) as any,
        },

        roadmap: expandedRoadmap.slice(0, 12),
        documents: documentsFallback.slice(0, 12),
    }
}

export async function GET() {
    if (responseCacheEntry && (Date.now() - responseCacheEntry.fetchedAt) < RESPONSE_CACHE_TTL_MS) {
        return new Response(responseCacheEntry.data, {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...responseCacheEntry.headers },
        })
    }

    try {
        const supabase = getSupabaseClient()
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: 'Missing Supabase environment variables', data: [] },
                { status: 500, headers: CACHE_HEADERS }
            )
        }
        // Supabase에서 모든 정책 데이터 가져오기
        const { data, error } = await supabase
            .from('policy_funds')
            .select('id,title,link,source_site,content_summary,region,biz_age,industry,amount,raw_content,agency,application_period,d_day,url,mobile_url,inquiry,application_method,roadmap,documents,criteria,created_at')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch policies from database', data: [] },
                { status: 500, headers: CACHE_HEADERS }
            )
        }

        const isTestPolicy = (p: PolicyFundDB) => {
            const source = (p.source_site || '').toUpperCase()
            const title = (p.title || '').toLowerCase()
            const link = (p.link || p.url || '').toLowerCase()
            return source === 'TEST' || title.includes('rls 테스트') || link.includes('test.com')
        }

        const isInvalidKStartup = (p: PolicyFundDB) => {
            const url = (p.link || p.url || '').toLowerCase()
            const source = (p.source_site || '').toUpperCase()
            const isKStartup = url.includes('k-startup.go.kr') || source.includes('K-STARTUP')
            if (!isKStartup) return false

            const hay = `${p.title || ''} ${p.content_summary || ''} ${p.raw_content || ''}`.toLowerCase()
            return (
                hay.includes('해당자료 없음') ||
                hay.includes('해당 자료 없음') ||
                hay.includes('검색결과가 없습니다') ||
                hay.includes('검색 결과가 없습니다')
            )
        }

        const filtered = (data as PolicyFundDB[]).filter((p) => !isTestPolicy(p) && !isInvalidKStartup(p))

        // DB 데이터를 UI 타입으로 변환 + D-Day 보정
        const policies: Policy[] = await mapWithLimit(filtered, 5, async (p) => {
            const mapped = mapDBToUI(p)
            const needsData =
                mapped.roadmap.length === 0 &&
                mapped.documents.length === 0 &&
                (mapped.dDay === 999 || mapped.dDay == null)
            const hasSearchUrl = mapped.url?.includes('schM=list&schStr=')
            if ((needsData || hasSearchUrl) && mapped.url && shouldFetchDday(mapped.url)) {
                const fetched = await fetchMetaFromUrl(mapped.url as string, mapped.title)
                if (fetched) {
                    if (fetched.resolvedUrl) mapped.url = fetched.resolvedUrl
                    if (fetched.dDay !== null) mapped.dDay = fetched.dDay
                    if (fetched.applicationPeriod) mapped.applicationPeriod = fetched.applicationPeriod
                    const syncedDday = computeDDayFromNormalizedPeriod(mapped.applicationPeriod)
                    if (syncedDday !== null) mapped.dDay = syncedDday
                    if (fetched.roadmap.length > 0) mapped.roadmap = expandCommaSeparatedRoadmap(fetched.roadmap).slice(0, 12)
                    if (fetched.documents.length > 0) mapped.documents = fetched.documents.slice(0, 12)
                }
            }
            return mapped
        })

        
        const kstartupBestByTitle = new Map<string, Policy>()
        const kstartupBestByPbanc = new Map<string, Policy>()
        for (const policy of policies) {
            if (!isKStartupPolicy(policy)) continue
            const key = normalizeTitleKey(policy.title)
            const pbancKey = extractKStartupPbancFromUrl(policy.url)

            if (pbancKey) {
                const byPbanc = kstartupBestByPbanc.get(pbancKey)
                if (!byPbanc || (isKStartupViewUrl(policy.url) && !isKStartupViewUrl(byPbanc.url))) {
                    kstartupBestByPbanc.set(pbancKey, policy)
                }
            }

            if (!key) continue
            const best = kstartupBestByTitle.get(key)
            if (!best) {
                kstartupBestByTitle.set(key, policy)
                continue
            }
            if (isKStartupViewUrl(policy.url) && !isKStartupViewUrl(best.url)) {
                kstartupBestByTitle.set(key, policy)
            }
        }

        const seenKstartupKeys = new Set<string>()
        const normalizedPolicies = policies.map((policy) => {
            if (!isKStartupPolicy(policy)) return policy
            const key = normalizeTitleKey(policy.title)
            const pbancKey = extractKStartupPbancFromUrl(policy.url)
            const best = (pbancKey ? kstartupBestByPbanc.get(pbancKey) : undefined) || kstartupBestByTitle.get(key)
            if (best?.url && policy.url !== best.url) {
                policy.url = best.url
            }
            return policy
        }).filter((policy) => {
            if (!isKStartupPolicy(policy)) return true
            const key = normalizeTitleKey(policy.title)
            const pbancKey = extractKStartupPbancFromUrl(policy.url)
            const dedupeKey = pbancKey ? `pbanc:${pbancKey}` : (key ? `title:${key}` : `id:${policy.id}`)
            if (seenKstartupKeys.has(dedupeKey)) return false
            seenKstartupKeys.add(dedupeKey)
            return true
        })

        const responseBody = JSON.stringify({
            success: true,
            data: normalizedPolicies,
            count: normalizedPolicies.length,
            error: null,
        })

        responseCacheEntry = { data: responseBody, headers: CACHE_HEADERS, fetchedAt: Date.now() }

        return new Response(responseBody, {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...CACHE_HEADERS },
        })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error', data: [] },
            { status: 500, headers: CACHE_HEADERS }
        )
    }
}
