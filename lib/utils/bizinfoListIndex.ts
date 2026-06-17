export interface BizinfoListEntry {
    pblancId: string
    title: string
    applicationPeriod: string
    dDay: number | null
}

const BIZINFO_LIST_BASE =
    'https://www.bizinfo.go.kr/sii/siia/selectSIIA200View.do?schEndAt=N&rows=100'
const BIZINFO_DETAIL_BASE = 'https://www.bizinfo.go.kr/sii/siia/selectSIIA200Detail.do'
const INDEX_TTL_MS = 2 * 60 * 60 * 1000
const FETCH_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
}

let indexCache: {
    fetchedAt: number
    byPblancId: Map<string, BizinfoListEntry>
} | null = null

function formatDateKst(date: Date): string {
    const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    const year = kst.getUTCFullYear()
    const month = String(kst.getUTCMonth() + 1).padStart(2, '0')
    const day = String(kst.getUTCDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
}

function calcDDay(end: Date): number {
    return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function parseEndDateFromPeriod(period: string): Date | null {
    const range = period.match(
        /(\d{4})[-.](\d{2})[-.](\d{2})\s*(?:~|∼|～|-)\s*(\d{4})[-.](\d{2})[-.](\d{2})/
    )
    if (range) {
        return new Date(Date.UTC(Number(range[4]), Number(range[5]) - 1, Number(range[6]), 14, 59, 59))
    }
    const until = period.match(/(\d{4})[-.](\d{2})[-.](\d{2})\s*(?:까지|마감)/)
    if (until) {
        return new Date(Date.UTC(Number(until[1]), Number(until[2]) - 1, Number(until[3]), 14, 59, 59))
    }
    const single = period.match(/^(\d{4})[-.](\d{2})[-.](\d{2})$/)
    if (single) {
        return new Date(Date.UTC(Number(single[1]), Number(single[2]) - 1, Number(single[3]), 14, 59, 59))
    }
    return null
}

function normalizeApplicationPeriod(raw: string): string {
    const text = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!text) return ''
    const range = text.match(
        /(\d{4}-\d{2}-\d{2})\s*(?:~|∼|～|-)\s*(\d{4}-\d{2}-\d{2})/
    )
    if (range) {
        return `${range[1].replace(/-/g, '.')} ~ ${range[2].replace(/-/g, '.')}`
    }
    return text
}

export function extractBizinfoPblancId(url?: string | null): string | undefined {
    if (!url) return undefined
    const match = url.match(/pblancId=(PBLN_\d+)/i)
    return match?.[1]
}

export function buildBizinfoDetailUrl(pblancId: string): string {
    return `${BIZINFO_DETAIL_BASE}?pblancId=${encodeURIComponent(pblancId)}`
}

export function isBizinfoSource(url?: string | null, sourcePlatform?: string | null): boolean {
    const u = (url || '').toLowerCase()
    const s = (sourcePlatform || '').toLowerCase()
    return u.includes('bizinfo.go.kr') || s.includes('기업마당') || s.includes('bizinfo')
}

/** 기업마당 지원사업 공고 목록 HTML 파싱 (schEndAt=N = 모집중) */
export function parseBizinfoListHtml(html: string): BizinfoListEntry[] {
    const entries: BizinfoListEntry[] = []
    const seen = new Set<string>()
    const regex = /pblancId=(PBLN_\d+)/gi
    let match: RegExpExecArray | null

    while ((match = regex.exec(html)) !== null) {
        const pblancId = match[1]
        if (seen.has(pblancId)) continue

        const chunk = html.slice(match.index, match.index + 2800)
        const titleMatch = chunk.match(/title="([^"]+)"/i)
        const title = (titleMatch?.[1] || '')
            .replace(/\s*페이지\s*이동\s*$/i, '')
            .trim()
        if (!title || title.length < 4) continue

        const periodMatch = chunk.match(/<\/a>\s*<\/td>\s*<td>\s*([\s\S]*?)<\/td>/i)
        const periodRaw = periodMatch?.[1] || ''
        const applicationPeriod = normalizeApplicationPeriod(periodRaw)
        if (!applicationPeriod) continue

        seen.add(pblancId)

        let dDay: number | null = null
        if (/상시|수시|세부사업별\s*상이|예산\s*소진/i.test(applicationPeriod)) {
            dDay = null
        } else {
            const end = parseEndDateFromPeriod(applicationPeriod.replace(/\./g, '-'))
            if (end) dDay = calcDDay(end)
        }

        entries.push({ pblancId, title, applicationPeriod, dDay })
    }

    return entries
}

async function fetchListPage(page: number): Promise<string | null> {
    const url = `${BIZINFO_LIST_BASE}&cpage=${page}`
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch(url, {
            headers: FETCH_HEADERS,
            signal: controller.signal,
            cache: 'no-store',
        })
        clearTimeout(timeoutId)
        if (!response.ok) return null
        return await response.text()
    } catch {
        return null
    }
}

export async function fetchBizinfoListIndex(): Promise<Map<string, BizinfoListEntry>> {
    if (indexCache && Date.now() - indexCache.fetchedAt < INDEX_TTL_MS) {
        return indexCache.byPblancId
    }

    const byPblancId = new Map<string, BizinfoListEntry>()
    const seen = new Set<string>()
    const maxPages = 30

    for (let batchStart = 1; batchStart <= maxPages; batchStart += 5) {
        const pages = Array.from({ length: Math.min(5, maxPages - batchStart + 1) }, (_, i) => batchStart + i)
        const htmls = await Promise.all(pages.map((page) => fetchListPage(page)))

        let batchAdded = 0
        for (const html of htmls) {
            if (!html) continue
            for (const entry of parseBizinfoListHtml(html)) {
                if (seen.has(entry.pblancId)) continue
                seen.add(entry.pblancId)
                byPblancId.set(entry.pblancId, entry)
                batchAdded++
            }
        }
        if (batchAdded === 0) break
    }

    indexCache = { fetchedAt: Date.now(), byPblancId }
    return byPblancId
}

export function isActiveBizinfoPolicy(
    policy: { url?: string | null; sourcePlatform?: string | null; dDay?: number | null },
    index: Map<string, BizinfoListEntry>
): boolean {
    if (!isBizinfoSource(policy.url, policy.sourcePlatform)) return true

    const pblancId = extractBizinfoPblancId(policy.url)
    if (!pblancId) return false

    const entry = index.get(pblancId)
    if (!entry) return false

    if (entry.dDay != null && entry.dDay < 0) return false
    if (policy.dDay != null && policy.dDay !== 999 && policy.dDay < 0) return false

    return true
}
