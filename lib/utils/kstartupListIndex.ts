import { buildKStartupViewUrl } from '@/lib/utils/kstartupUrl'

export interface KStartupListEntry {
    pbancSn: string
    title: string
    dDay: number | null
    applicationPeriod: string | null
}

const KSTARTUP_LIST_URL = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=list'
const INDEX_TTL_MS = 2 * 60 * 60 * 1000
const FETCH_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
}

let indexCache: { fetchedAt: number; entries: KStartupListEntry[]; byKey: Map<string, KStartupListEntry> } | null =
    null

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

export function normalizeKStartupTitleKey(title: string): string {
    return (title || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\b[가-힣A-Za-z]*\s*D-\d+\b/gi, ' ')
        .replace(/마감일자?\s*\d{4}[-.]\d{2}[-.]\d{2}/gi, ' ')
        .replace(/\b조회\s*[\d,]+/gi, ' ')
        .replace(/새로운게시글|신규글|새글|NEW/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/[^0-9a-z\uAC00-\uD7A3]/gi, '')
}

function tokenizeTitle(title: string): string[] {
    return normalizeKStartupTitleKey(title)
        .replace(/([a-z\uAC00-\uD7A3])(\d)/gi, '$1 $2')
        .replace(/(\d)([a-z\uAC00-\uD7A3])/gi, '$1 $2')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
}

/** K-Startup 목록 HTML에서 go_view(id) + 제목 + 마감일 파싱 */
export function parseKStartupListHtml(html: string): KStartupListEntry[] {
    const entries: KStartupListEntry[] = []
    const seen = new Set<string>()
    const regex = /go_view(?:_blank)?\((\d+)\)/gi
    let match: RegExpExecArray | null

    while ((match = regex.exec(html)) !== null) {
        const pbancSn = match[1]
        if (seen.has(pbancSn)) continue

        const windowStart = Math.max(0, match.index - 500)
        const window = html.slice(windowStart, match.index + 1800)
        const titMatch = window.match(/class=["']tit["'][^>]*>([\s\S]*?)<\/p>/i)
        if (!titMatch) continue

        const title = titMatch[1]
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        if (title.length < 6 || title.includes('등록된 데이터가 없습니다')) continue

        seen.add(pbancSn)

        const deadlineMatch = window.match(/(?:마감일자?)\s*(\d{4})[-.](\d{2})[-.](\d{2})/i)
        let applicationPeriod: string | null = null
        let dDay: number | null = null

        if (deadlineMatch) {
            const end = new Date(
                Date.UTC(Number(deadlineMatch[1]), Number(deadlineMatch[2]) - 1, Number(deadlineMatch[3]), 14, 59, 59)
            )
            applicationPeriod = `~ ${formatDateKst(end)}`
            dDay = calcDDay(end)
        } else {
            const dMatch = window.match(/\bD-(\d+)\b/i)
            if (dMatch) dDay = Number(dMatch[1])
        }

        entries.push({ pbancSn, title, dDay, applicationPeriod })
    }

    return entries
}

async function fetchListPage(page: number): Promise<string | null> {
    const url = page <= 1 ? KSTARTUP_LIST_URL : `${KSTARTUP_LIST_URL}&page=${page}`
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        const response = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal, cache: 'no-store' })
        clearTimeout(timeoutId)
        if (!response.ok) return null
        return await response.text()
    } catch {
        return null
    }
}

export async function fetchKStartupListIndex(): Promise<{
    entries: KStartupListEntry[]
    byKey: Map<string, KStartupListEntry>
}> {
    if (indexCache && Date.now() - indexCache.fetchedAt < INDEX_TTL_MS) {
        return { entries: indexCache.entries, byKey: indexCache.byKey }
    }

    const allEntries: KStartupListEntry[] = []
    const seenPbanc = new Set<string>()
    const maxPages = 12

    const firstHtml = await fetchListPage(1)
    if (firstHtml) {
        for (const entry of parseKStartupListHtml(firstHtml)) {
            if (!seenPbanc.has(entry.pbancSn)) {
                seenPbanc.add(entry.pbancSn)
                allEntries.push(entry)
            }
        }
    }

    const pageNumbers = Array.from({ length: maxPages - 1 }, (_, i) => i + 2)
    const pageHtmls = await Promise.all(pageNumbers.map((page) => fetchListPage(page)))

    for (const html of pageHtmls) {
        if (!html) continue
        let added = 0
        for (const entry of parseKStartupListHtml(html)) {
            if (seenPbanc.has(entry.pbancSn)) continue
            seenPbanc.add(entry.pbancSn)
            allEntries.push(entry)
            added++
        }
        if (added === 0) break
    }

    const byKey = new Map<string, KStartupListEntry>()
    for (const entry of allEntries) {
        const key = normalizeKStartupTitleKey(entry.title)
        if (key && !byKey.has(key)) byKey.set(key, entry)
    }

    indexCache = { fetchedAt: Date.now(), entries: allEntries, byKey }
    return { entries: allEntries, byKey }
}

export function lookupKStartupListEntry(
    title: string,
    byKey: Map<string, KStartupListEntry>
): KStartupListEntry | undefined {
    const key = normalizeKStartupTitleKey(title)
    if (key && byKey.has(key)) return byKey.get(key)

    const tokens = tokenizeTitle(title)
    if (tokens.length === 0) return undefined

    let best: { entry: KStartupListEntry; score: number } | undefined
    for (const entry of byKey.values()) {
        const entryTokens = new Set(tokenizeTitle(entry.title))
        const overlap = tokens.filter((t) => entryTokens.has(t)).length
        const minRequired = Math.min(3, tokens.length)
        if (overlap < minRequired) continue
        const score = overlap / Math.max(tokens.length, entryTokens.size)
        if (!best || score > best.score) best = { entry, score }
    }

    return best && best.score >= 0.45 ? best.entry : undefined
}

export function buildViewUrlFromEntry(entry: KStartupListEntry): string {
    return buildKStartupViewUrl(entry.pbancSn)
}
