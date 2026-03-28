
function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '\n') // Replace tags with newlines to preserve structure
        .replace(/&nbsp;/gi, ' ')
        .replace(/[ \t]+/g, ' ') // Collapse spaces but keep newlines
        .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
        .trim();
}

function getPolicySummary(summary: string | undefined, detailContent?: string): string {
    // 1. If valid summary exists, use it
    if (summary && summary.trim().length > 10 && !summary.includes('요약정보가 없습니다')) return summary;
    if (!detailContent) return '';

    // 2. Strip HTML tags and clean whitespace
    const stripped = stripHtml(detailContent).replace(/\n/g, ' ');

    if (!stripped) return '';

    // 3. Try to extract introductory announcement (High priority)
    const introRegex = /([^.!?]*(?:모집|공고|시행|안내)[^.!?]*(?:합니다|하오니|바랍니다)[\.]?)/i;
    const introMatch = stripped.match(introRegex);

    if (introMatch && introMatch[1]) {
        let introText = introMatch[1].trim();
        introText = introText.replace(/다음과\s*같이/g, '').replace(/\s+/g, ' ').trim();
        if (introText.length > 20) return "MATCH MATCH:" + introText;
    }

    // 4. Try keywords
    const overviewKeywords = ['사업개요', '사업목적', '지원분야', '지원대상', '개요', '신청자격'];
    for (const keyword of overviewKeywords) {
        const idx = stripped.indexOf(keyword);
        if (idx !== -1) {
            const start = idx + keyword.length;
            let chunk = stripped.substring(start, start + 300).trim();
            chunk = chunk.replace(/^[:\.\-]\s*/, '');
            if (chunk.length > 20) return "KEYWORD MATCH:" + chunk + (stripped.length > start + 300 ? '...' : '');
        }
    }

    // 5. Last Resort Fallback
    let fallback = stripped.substring(0, 300);
    fallback = fallback.replace(/다음과\s*같이/g, '').replace(/\s+/g, ' ').trim();
    return "FALLBACK:" + fallback + (stripped.length > 300 ? '...' : '');
}

const mockDetailContent = `
<div class="content">
    <p>중소벤처기업부 공고 제2026-87호</p>
    <p><strong>2026년 재도전성공패키지 예비재창업자 및 재창업기업 모집공고</strong></p>
    <p>성실한 실패 경험과 우수한 아이템을 바탕으로 성장 가능성이 높은 (예비)재창업기업을 발굴하고,</p>
    <p>패키지형 재창업 지원을 위한 「2026년도 재도전성공패키지 (예비)재창업기업 모집계획」 을</p>
    <p>다음과같이 공고합니다.</p>
    <br>
    <p align="right">2026년 02월 10일</p>
    <p align="right">중소벤처기업부 장관</p>
</div>
`;

console.log(getPolicySummary('', mockDetailContent));
