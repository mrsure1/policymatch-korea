const PLACEHOLDER_AMOUNT = /^(null|undefined|미정|미명시|미지정|공고문\s*참조|홈페이지\s*참조|미\s*명\s*시)$/i
const PLACEHOLDER_AGENCY = /^(null|undefined|미정|기업마당|정부기관)$/i

export function normalizeSupportAmount(value?: string | null): string | null {
    if (!value) return null
    const text = value.trim()
    if (!text || PLACEHOLDER_AMOUNT.test(text)) return null
    return text
}

export function normalizeAgencyLabel(value?: string | null, sourceLabel?: string): string | null {
    if (!value) return null
    const text = value.trim()
    if (!text || PLACEHOLDER_AGENCY.test(text)) return null
    if (sourceLabel && text === sourceLabel) return null
    return text
}

export function formatApplicationPeriodDisplay(value?: string | null): string {
    if (!value) return '신청기간 확인'
    const text = value.trim()
    if (!text || /^(null|undefined|미정|미명시|미지정|공고문\s*확인)$/i.test(text)) {
        return '신청기간 확인'
    }
    if (/^세부사업별\s*상이$/i.test(text)) return '세부사업별 상이'
    return text
}
