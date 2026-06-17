/** K-Startup 스크래핑 제목에 포함된 D-Day·마감일 메타데이터 추출 */

export interface KStartupTitleMeta {
    dDay: number | null
    applicationPeriod: string | null
}

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

function parseDeadline(raw: string): Date | null {
    const match = raw.match(/(?:마감일자?|접수\s*마감|신청\s*마감)\s*(\d{4})[-.](\d{2})[-.](\d{2})/i)
    if (!match) return null
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 14, 59, 59))
}

/**
 * DB에 저장된 K-Startup 원본 제목에서 D-Day·신청기간 추출.
 * 예: "사업화D-7마감일자 2026-02-132026년도 초기창업패키지..."
 */
export function extractKStartupTitleMeta(rawTitle?: string | null): KStartupTitleMeta {
    if (!rawTitle) return { dDay: null, applicationPeriod: null }

    const deadline = parseDeadline(rawTitle)
    const embeddedDday = rawTitle.match(/\bD-(\d+)\b/i)?.[1]

    if (deadline) {
        const dDay = calcDDay(deadline)
        return {
            dDay,
            applicationPeriod: `~ ${formatDateKst(deadline)}`,
        }
    }

    if (embeddedDday) {
        const dDay = Number(embeddedDday)
        if (Number.isFinite(dDay)) {
            return { dDay, applicationPeriod: null }
        }
    }

    return { dDay: null, applicationPeriod: null }
}
