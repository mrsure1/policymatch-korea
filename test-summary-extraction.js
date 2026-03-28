// Test script to diagnose summary extraction issue for Policy ID 671
// Run with: node test-summary-extraction.js

// Helper to strip HTML and clean text
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        // Replace block elements with newlines
        .replace(/<\/?(div|p|h[1-6]|li|tr|br|ul|ol|table|section|article|aside|header|footer)[^>]*>/gi, '\n')
        // Remove all other tags (inline like b, span, etc)
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ') // Collapse spaces but keep newlines
        .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
        .trim();
}

function getPolicySummary(summary, detailContent) {
    // 1. If valid summary exists, use it
    if (summary && summary.trim().length > 10 && !summary.includes('요약정보가 없습니다')) {
        console.log('✓ Using provided summary:', summary.substring(0, 100) + '...');
        return summary;
    }

    if (!detailContent) {
        console.log('✗ No detailContent provided');
        return '';
    }

    console.log('\n📋 Original detailContent (first 500 chars):');
    console.log(detailContent.substring(0, 500));

    // 2. Strip HTML tags and clean whitespace
    const stripped = stripHtml(detailContent).replace(/\n/g, ' ');

    console.log('\n📝 Stripped content (first 500 chars):');
    console.log(stripped.substring(0, 500));

    if (!stripped || stripped.length < 5) {
        console.log('✗ Stripped content too short');
        return '';
    }

    // 3. Try to extract introductory announcement (High priority)
    const introRegex = /([^.!?]*(?:모집|공고|시행|안내)[^.!?]*(?:합니다|하오니|바랍니다)[\.]?)/i;
    const introMatch = stripped.match(introRegex);

    console.log('\n🔍 Testing intro regex...');
    if (introMatch && introMatch[1]) {
        let introText = introMatch[1].trim();
        console.log('✓ Intro match found:', introText.substring(0, 100) + '...');

        // Remove "다음과 같이" if present
        introText = introText.replace(/다음과\s*같이/g, '').replace(/\s+/g, ' ').trim();

        console.log('✓ After cleanup:', introText.substring(0, 100) + '...');
        console.log('✓ Length:', introText.length);

        // If the captured text is substantial, return it
        if (introText.length > 20) {
            console.log('✓ RETURNING intro text');
            return introText;
        }
    } else {
        console.log('✗ No intro match found');
    }

    // 4. Try keywords (Content sections)
    console.log('\n🔍 Testing keywords...');
    const overviewKeywords = ['사업개요', '사업목적', '지원분야', '지원대상', '개요', '신청자격'];
    for (const keyword of overviewKeywords) {
        const idx = stripped.indexOf(keyword);
        if (idx !== -1) {
            const start = idx + keyword.length;
            let chunk = stripped.substring(start, start + 300).trim();
            chunk = chunk.replace(/^[:\.\-]\s*/, '');

            console.log(`✓ Found keyword "${keyword}" at position ${idx}`);
            console.log('✓ Chunk:', chunk.substring(0, 100) + '...');

            if (chunk.length > 20) {
                console.log('✓ RETURNING keyword-based chunk');
                return chunk + (stripped.length > start + 300 ? '...' : '');
            }
        }
    }
    console.log('✗ No keywords matched');

    // 5. Last Resort Fallback
    console.log('\n🔍 Using fallback...');
    let fallback = stripped.substring(0, 400);
    fallback = fallback.replace(/다음과\s*같이/g, '').replace(/\s+/g, ' ').trim();

    console.log('✓ Fallback:', fallback.substring(0, 100) + '...');
    console.log('✓ RETURNING fallback');

    return fallback + (stripped.length > 400 ? '...' : '');
}

// Test Data - Simulating what might be in the database for Policy ID 671
const testCases = [
    {
        name: 'Case 1: K-Startup HTML with proper content',
        summary: '',
        detailContent: `
            <div class="content">
                <p class="title">중소벤처기업부 공고 제2026-87호</p>
                <p class="title">2026년 재도전성공패키지 예비재창업자 및 재창업기업 모집공고</p>
                <p>성실한 실패 경험과 우수한 아이템을 바탕으로 성장 가능성이 높은 (예비)재창업기업을 발굴하고, 패키지형 재창업 지원을 위한「2026년도 재도전성공패키지 (예비)재창업기업 모집계획」을 다음과 같이 공고합니다.</p>
                <p>2026년 02월 10일</p>
                <p>중소벤처기업부 장관</p>
            </div>
        `
    },
    {
        name: 'Case 2: Minimal HTML',
        summary: '',
        detailContent: `성실한 실패 경험과 우수한 아이템을 바탕으로 성장 가능성이 높은 (예비)재창업기업을 발굴하고, 패키지형 재창업 지원을 위한「2026년도 재도전성공패키지 (예비)재창업기업 모집계획」을 다음과 같이 공고합니다.`
    },
    {
        name: 'Case 3: Empty detailContent',
        summary: '',
        detailContent: ''
    },
    {
        name: 'Case 4: Valid summary provided',
        summary: '재도전성공패키지 모집 공고입니다.',
        detailContent: '<p>Some other content</p>'
    }
];

// Run tests
console.log('='.repeat(80));
console.log('SUMMARY EXTRACTION TEST');
console.log('='.repeat(80));

testCases.forEach((testCase, index) => {
    console.log('\n' + '='.repeat(80));
    console.log(`TEST ${index + 1}: ${testCase.name}`);
    console.log('='.repeat(80));

    const result = getPolicySummary(testCase.summary, testCase.detailContent);

    console.log('\n📊 FINAL RESULT:');
    console.log(result || '(empty)');
    console.log('\n');
});
