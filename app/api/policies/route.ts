import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import type { PolicyFundDB } from '@/lib/supabase/client'
import type { Policy } from '@/lib/mockPolicies'

function cleanKStartupSearchTerm(title?: string): string {
    if (!title) return ''
    let cleaned = title.trim()
    // Remove leading bracketed prefix like "[기관]" or "(기관)" or "【기관】" or "「기관」"
    cleaned = cleaned.replace(/^\s*(?:(?:\[[^\]]+\]|\([^)]+\)|【[^】]+】|「[^」]+」)\s*)+/g, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    return cleaned
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

function stripHtml(text?: string | null): string {
    if (!text) return ''
    const decodedFirst = decodeHtmlEntities(text)
    const withoutTags = decodedFirst
        .replace(/<[^>]*>/g, ' ')
        .replace(/<[^>]*$/g, ' ') // handle truncated tags
    const decodedAgain = decodeHtmlEntities(withoutTags)
    return decodedAgain.replace(/\s+/g, ' ').trim()
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

function extractDateRangeFromText(text: string): { start: Date; end: Date } | null {
    const normalized = text.replace(/\s+/g, ' ')
    const labelHints = /(\uC2E0\uCCAD|\uC811\uC218|\uBAA8\uC9D1|\uACF5\uACE0|\uC0AC\uC5C5)\s*\uAE30\uAC04[^0-9]{0,10}(.{0,120})/g
    const rangeRegexes: RegExp[] = [
        /(\d{4}[^~]{0,40}\d{1,2}[^~]{0,40}\d{1,2}[^~]{0,20})\s*(?:~|\uFF5E|\u2212|-|\u2014|\uBD80\uD130)\s*(\d{4}[^~]{0,40}\d{1,2}[^~]{0,40}\d{1,2}[^~]{0,20})/g,
        /(\d{4}[^~]{0,40}\d{1,2}[^~]{0,40}\d{1,2}[^~]{0,20})\s*(?:~|\uFF5E|\u2212|-|\u2014|\uBD80\uD130)\s*(\d{1,2}[^~]{0,10}\d{1,2}[^~]{0,10})/g,
    ]

    const findRange = (source: string): { start: Date; end: Date } | null => {
        for (const regex of rangeRegexes) {
            regex.lastIndex = 0
            const match = regex.exec(source)
            if (!match) continue
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
            return { start, end }
        }
        return null
    }

    let labelMatch: RegExpExecArray | null
    while ((labelMatch = labelHints.exec(normalized)) !== null) {
        const segment = labelMatch[0]
        const range = findRange(segment)
        if (range) return range
    }

    return findRange(normalized)
}

function computeApplicationPeriod(applicationPeriod?: string | null, contentSummary?: string | null, rawContent?: string | null): string | null {
    const combined = [applicationPeriod, contentSummary, rawContent].filter(Boolean).join(' ')
    const text = stripHtml(combined)
    if (!text) return null
    const range = extractDateRangeFromText(text)
    if (range) {
        return `${formatDateKst(range.start)} ~ ${formatDateKst(range.end)}`
    }
    if (/(\uC0C1\uC2DC|\uC218\uC2DC|\uC608\uC0B0\s*\uC18C\uC9C4|\uC608\uC0B0\uC18C\uC9C4)/.test(text)) return '\uC0C1\uC2DC'
    return null
}

function computeDDay(applicationPeriod?: string | null, contentSummary?: string | null, rawContent?: string | null): number | null {
    const combined = [applicationPeriod, contentSummary, rawContent].filter(Boolean).join(' ')
    const text = stripHtml(combined)
    if (!text) return null

    const dates = extractDatesFromText(text)
    if (dates.length === 0) {
        if (/(상시|수시|예산\s*소진|예산소진)/.test(text)) return null
        return null
    }

    const latest = dates.reduce((acc, cur) => (cur > acc ? cur : acc), dates[0])
    const diff = latest.getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function isMeaningfulApplicationPeriod(value?: string | null): boolean {
    if (!value) return false
    const text = stripHtml(value)
    if (!text) return false
    if (/(\uC0C1\uC2DC|\uC218\uC2DC|\uC608\uC0B0\s*\uC18C\uC9C4|\uC608\uC0B0\uC18C\uC9C4|\uD648\uD398\uC774\uC9C0|\uCC38\uC870|\uBB38\uC758|\uBBF8\uC815)/.test(text) && !/\d{4}/.test(text)) {
        return false
    }
    if (/\d{4}\D+\d{1,2}\D+\d{1,2}/.test(text)) return true
    if (/(\d{1,2}\D+\d{1,2})/.test(text) && /(~|\uBD80\uD130|\uAE4C\uC9C0)/.test(text)) return true
    return false
}

const metaCache = new Map<string, { dDay: number | null; applicationPeriod: string | null }>()

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

async function fetchMetaFromUrl(url: string): Promise<{ dDay: number | null; applicationPeriod: string | null } | null> {
    if (metaCache.has(url)) return metaCache.get(url) ?? null
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
            },
        })
        clearTimeout(timeoutId)
        if (!response.ok) return null
        const html = await response.text()
        const text = stripHtml(html)
        const applicationPeriod = computeApplicationPeriod(text, text, text)
        const dates = extractDatesFromText(text)
        let dDay: number | null = null
        if (dates.length > 0) {
            const latest = dates.reduce((acc, cur) => (cur > acc ? cur : acc), dates[0])
            const diff = latest.getTime() - Date.now()
            dDay = Math.ceil(diff / (1000 * 60 * 60 * 24))
        }
        const result = { dDay, applicationPeriod }
        metaCache.set(url, result)
        return result
    } catch {
        return null
    }
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

    const pbancMatch = url.match(/pbancSn=(\d+)/)
    const pbancSn = pbancMatch?.[1]
    if (pbancSn) {
        return `${base}?schM=view&pbancSn=${pbancSn}`
    }

    // If original URL already has search keyword, keep it
    if (url.includes('schStr=')) {
        return url
    }

    const searchTerm = cleanKStartupSearchTerm(title)
    if (searchTerm) {
        return `${base}?schM=list&schStr=${encodeURIComponent(searchTerm)}`
    }

    return base
}

// DB 데이터 → UI 타입 변환
function mapDBToUI(dbPolicy: PolicyFundDB): Policy {
    const sourceFromUrl = inferSourcePlatformFromUrl(dbPolicy.link || dbPolicy.url)
    const sourceFromSite = normalizeSourceLabel(dbPolicy.source_site)
    const sourcePlatform = sourceFromUrl || sourceFromSite
    const cleanedTitle = extractTitleFromHtml(dbPolicy.title) || stripHtml(dbPolicy.title)
    const cleanedSummary = stripHtml(dbPolicy.content_summary)
    const cleanedPeriod = stripHtml(dbPolicy.application_period)
    const computedPeriod = computeApplicationPeriod(dbPolicy.application_period, dbPolicy.content_summary, dbPolicy.raw_content)
    const computedDDayRaw = computeDDay(dbPolicy.application_period, dbPolicy.content_summary, dbPolicy.raw_content)
    const computedDDay = Number.isFinite(computedDDayRaw) ? computedDDayRaw : null
    return {
        id: String(dbPolicy.id), // 숫자 ID를 문자열로 변환
        title: cleanedTitle || '제목 없음',
        summary: cleanedSummary || '',
        supportAmount: dbPolicy.amount || '미정',
        dDay: computedDDay ?? dbPolicy.d_day ?? 999,
        applicationPeriod: isMeaningfulApplicationPeriod(cleanedPeriod)
            ? cleanedPeriod
            : computedPeriod || cleanedPeriod || '\uC0C1\uC2DC',
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

        roadmap: dbPolicy.roadmap || [],
        documents: dbPolicy.documents || [],
    }
}

export async function GET() {
    try {
        // Supabase에서 모든 정책 데이터 가져오기
        const { data, error } = await supabase
            .from('policy_funds')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch policies from database', data: [] },
                { status: 500 }
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
            const needsDday = mapped.dDay === 999 || mapped.dDay === null
            const needsPeriod = !isMeaningfulApplicationPeriod(mapped.applicationPeriod)
            if ((needsDday || needsPeriod) && shouldFetchDday(mapped.url)) {
                const fetched = await fetchMetaFromUrl(mapped.url as string)
                if (fetched) {
                    if (needsDday && fetched.dDay !== null) mapped.dDay = fetched.dDay
                    if (needsPeriod && fetched.applicationPeriod) mapped.applicationPeriod = fetched.applicationPeriod
                }
            }
            return mapped
        })

        console.log(`✅ Fetched ${policies.length} policies, IDs:`, policies.map(p => p.id))

        return NextResponse.json({
            success: true,
            data: policies,
            count: policies.length,
            error: null
        })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error', data: [] },
            { status: 500 }
        )
    }
}