import type { PolicyRoadmapStep, PolicyDocument } from '@/lib/mockPolicies';

// Helper to strip HTML and clean text
function stripHtml(html: string): string {
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

export function getPolicySummary(summary: string | undefined, detailContent?: string): string {
    // 1. If valid summary exists, use it
    if (summary && summary.trim().length > 10 && !summary.includes('요약정보가 없습니다')) return summary;

    if (!detailContent) return '';

    // 2. Strip HTML tags and clean whitespace
    // Replace newlines with spaces for summary extraction to treat as one block
    const stripped = stripHtml(detailContent).replace(/\n/g, ' ');

    if (!stripped || stripped.length < 5) return '';

    // 3. Try to extract introductory announcement (High priority)
    // Matches text ending in "공고합니다", "모집합니다" etc. allowing for "다음과 같이" before it.
    // Capture the *entire* sentence structure leading up to it. 
    // Relaxed regex to catch "2026년 ... 공고합니다" even if separated by random chars
    const introRegex = /([^.!?]*(?:모집|공고|시행|안내)[^.!?]*(?:합니다|하오니|바랍니다)[\.]?)/i;
    const introMatch = stripped.match(introRegex);

    if (introMatch && introMatch[1]) {
        let introText = introMatch[1].trim();
        // Remove "다음과 같이" if present
        introText = introText.replace(/다음과\s*같이/g, '').replace(/\s+/g, ' ').trim();

        // If the captured text is substantial, return it
        if (introText.length > 20) {
            return introText;
        }
    }

    // 4. Try keywords (Content sections)
    const overviewKeywords = ['사업개요', '사업목적', '지원분야', '지원대상', '개요', '신청자격'];
    for (const keyword of overviewKeywords) {
        const idx = stripped.indexOf(keyword);
        if (idx !== -1) {
            const start = idx + keyword.length;
            // Take up to 300 chars
            let chunk = stripped.substring(start, start + 300).trim();
            // Remove leading punctuation (colon, dot) often found like "사업개요 : ..."
            chunk = chunk.replace(/^[:\.\-]\s*/, '');

            if (chunk.length > 20) {
                return chunk + (stripped.length > start + 300 ? '...' : '');
            }
        }
    }

    // 5. Last Resort Fallback: Just take the first clean chunk of text
    // Avoid "다음과 같이" if it appears in the fallback
    let fallback = stripped.substring(0, 400); // Increased buffer
    fallback = fallback.replace(/다음과\s*같이/g, '').replace(/\s+/g, ' ').trim();

    // Ensure we return something if content exists
    return fallback + (stripped.length > 400 ? '...' : '');
}

function parseJsonValue(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

const DOCUMENT_EXCLUDE_PATTERN = /제출하신\s*서류는\s*사업운영기관에서\s*관리되오니.*$/i;
const ROADMAP_SPLIT_PATTERN = /\s*(?:,|，|·|ㆍ|;|\/|및|그리고|→|->)\s*/g;
const DOCUMENT_KEYWORD_PATTERN = /(신청서|계획서|동의서|증명서|확약서|등록증|등본|명부|보고서|제안서|서류|자료|증빙)/;

function splitTextItems(text: string): string[] {
    return text
        .split(/[\n\r\u2022\u00B7\-\*]+/g)
        .map((line) => line.trim())
        .filter(Boolean);
}

function splitDocumentName(text: string): string[] {
    if (!text) return [];
    let cleaned = text.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/\s*(필수|우대\/추가)\s*$/g, '');
    if (!cleaned) return [];

    const commaParts = cleaned
        .split(/\s*(?:,|·|ㆍ|;|\/)\s*/g)
        .map((part) => part.trim())
        .filter(Boolean);

    const results: string[] = [];
    for (const part of commaParts) {
        const andParts = part.split(/\s+및\s+/).map((item) => item.trim()).filter(Boolean);
        if (andParts.length > 1) {
            const keywordHits = andParts.filter((item) => DOCUMENT_KEYWORD_PATTERN.test(item)).length;
            if (keywordHits >= 2) {
                results.push(...andParts);
                continue;
            }
        }
        results.push(part);
    }

    return results.filter(Boolean);
}

function countDocumentName(text: string): number {
    if (!text) return 0;
    return splitDocumentName(text).length || 0;
}

function splitRoadmapItems(text: string): string[] {
    if (!text) return [];
    let cleaned = text.split('※')[0] || '';
    cleaned = cleaned.replace(/\([^)]*참조[^)]*\)/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];

    // If text looks like "1. Step 2. Step 3. Step"
    if (/\d+\./.test(cleaned)) {
        return cleaned.split(/\d+\./).map(s => s.trim()).filter(Boolean);
    }

    return cleaned
        .split(ROADMAP_SPLIT_PATTERN)
        .map((item) =>
            item
                .replace(/\(.*?\)/g, ' ')
                .replace(/\s*등.*$/g, '')
                .trim()
        )
        .filter(Boolean);
}

function isGenericRoadmapTitle(title: string): boolean {
    if (!title) return true;
    return /^(단계|step)\s*\d+/i.test(title.trim());
}

export function normalizeRoadmapSteps(steps: PolicyRoadmapStep[]): PolicyRoadmapStep[] {
    if (!Array.isArray(steps) || steps.length !== 1) return steps;
    const step = steps[0] || ({} as PolicyRoadmapStep);
    const rawTitle = typeof step.title === 'string' ? step.title : '';
    const rawDesc = typeof step.description === 'string' ? step.description : '';
    const baseText = rawTitle && !isGenericRoadmapTitle(rawTitle) ? rawTitle : (rawDesc || rawTitle);
    const parts = splitRoadmapItems(baseText);
    if (parts.length <= 1) return steps;
    return parts.slice(0, 12).map((title, index) => ({
        step: index + 1,
        title,
        description: '',
    }));
}

function isExcludedDocument(value: unknown): boolean {
    if (!value) return false;
    if (typeof value === 'string') {
        return DOCUMENT_EXCLUDE_PATTERN.test(value);
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name : typeof obj.title === 'string' ? obj.title : '';
        return name ? DOCUMENT_EXCLUDE_PATTERN.test(name) : false;
    }
    return false;
}

function filterDocumentsArray(items: unknown[]): unknown[] {
    return items.filter((item) => !isExcludedDocument(item));
}

export function filterDocumentsForDisplay<T extends { name?: string }>(documents: T[]): T[] {
    const expanded: T[] = [];
    for (const doc of documents) {
        const name = doc?.name || '';
        if (isExcludedDocument(name)) continue;
        const parts = splitDocumentName(name);
        if (parts.length <= 1) {
            expanded.push(doc);
            continue;
        }
        for (const part of parts) {
            expanded.push({ ...doc, name: part });
        }
    }
    return expanded;
}

export function getRoadmapSteps(roadmap: PolicyRoadmapStep[] | undefined, detailContent?: string): PolicyRoadmapStep[] {
    const validRoadmap = normalizeRoadmapSteps(roadmap || []);
    if (validRoadmap.length > 0) return validRoadmap;

    if (!detailContent) return [];

    const stripped = stripHtml(detailContent);

    // 1. Try to find "선정절차", "평가방법", "절차" section
    const roadmapKeywords = ['선정절차 및 평가방법', '선정절차', '평가방법', '평가절차', '신청절차', '진행절차'];
    let roadmapText = '';

    for (const keyword of roadmapKeywords) {
        // Updated regex to handle "Header \n Content" or "Header : Content"
        // And stop at next header-like line
        const regex = new RegExp(`${keyword}[:\\s]*(?:\\n|\\s|$)([\\s\\S]*?)(?:\\n[가-힣]+(?:절차|방법|안내|문의|사항|서류)|$)`, 'i');
        const match = stripped.match(regex);
        if (match && match[1]) {
            const candidate = match[1].trim();
            // Filter out obvious noise?
            if (candidate.length > 5) {
                roadmapText = candidate;
                break;
            }
        }
    }

    if (roadmapText) {
        const parts = splitRoadmapItems(roadmapText);
        return parts.map((title, index) => ({
            step: index + 1,
            title: title.replace(/^\d+\.\s*/, ''),
            description: '',
        }));
    }

    return [];
}

export function getRequiredDocuments(documents: PolicyDocument[] | undefined, detailContent?: string): PolicyDocument[] {
    const validDocs = filterDocumentsForDisplay(documents || []) as PolicyDocument[];
    if (validDocs.length > 0) return validDocs;

    if (!detailContent) return [];

    const stripped = stripHtml(detailContent);

    // 2. Try to find "제출서류", "신청서류", "구비서류" section
    const docKeywords = ['제출서류', '신청서류', '구비서류', '필수서류', '신청 시 요청하는 정보'];
    let docText = '';

    // Look for section headers
    for (const keyword of docKeywords) {
        const regex = new RegExp(`${keyword}[:\\s]*(?:\\n|\\s|$)([\\s\\S]*?)(?:\\n[가-힣]+(?:절차|방법|안내|문의|사항|서류)|\\n\\d+\\.|$)`, 'i');
        const match = stripped.match(regex);
        if (match && match[1]) {
            docText = match[1].trim();
            break;
        }
    }

    if (docText) {
        // Remove common disclaimer text in document section
        docText = docText.replace(/제출하신\s*서류는\s*사업운영기관에서\s*관리되오니.*$/i, '');
        docText = docText.replace(/인베스트 경기 지침 참고/g, ''); // Specific noise removal
        docText = docText.replace(/개인정보포함/g, ''); // User screenshot specific

        const docNames = splitDocumentName(docText);
        return docNames.map((name) => ({
            name: name,
            category: '필수', // Default category since we don't know if it's required/optional
            whereToGet: '공고문 참조',
        }));
    }

    return [];
}

export function getRoadmapCount(value: unknown, detailContent?: string): number {
    const parsed = parseJsonValue(value);

    // 1. Try structured data first
    if (Array.isArray(parsed)) {
        const steps = normalizeRoadmapSteps(parsed as PolicyRoadmapStep[]);
        if (steps.length > 0) return steps.length;
    }

    // 2. If structured data is empty/invalid, try parsing detailContent
    if (detailContent) {
        const extracted = getRoadmapSteps([], detailContent);
        if (extracted.length > 0) return extracted.length;
    }

    // Original fallback logic for string/object inputs (keep as is for simple cases)
    if (typeof parsed === 'string') {
        const byLines = splitTextItems(parsed);
        if (byLines.length > 1) return byLines.length;
        const byComma = splitRoadmapItems(parsed);
        return byComma.length;
    }
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const candidates = [obj.steps, obj.roadmap, obj.items, obj.process, obj.procedures];
        const arr = candidates.find((item) => Array.isArray(item)) as unknown[] | undefined;
        return arr ? normalizeRoadmapSteps(arr as PolicyRoadmapStep[]).length : 0;
    }
    return 0;
}

export function getDocumentCount(value: unknown, detailContent?: string): number {
    const parsed = parseJsonValue(value);

    // 1. Try structured data first
    if (Array.isArray(parsed)) {
        const docs = filterDocumentsArray(parsed);
        if (docs.length > 0) {
            return docs.reduce<number>((sum, item) => {
                if (isExcludedDocument(item)) return sum;
                if (typeof item === 'string') return sum + countDocumentName(item);
                if (item && typeof item === 'object') {
                    const obj = item as Record<string, unknown>;
                    const name = typeof obj.name === 'string' ? obj.name : typeof obj.title === 'string' ? obj.title : '';
                    return name ? sum + countDocumentName(name) : sum + 1;
                }
                return sum + 1;
            }, 0);
        }
    }

    // 2. If structured data is empty/invalid, try parsing detailContent
    if (detailContent) {
        const extracted = getRequiredDocuments([], detailContent);
        if (extracted.length > 0) return extracted.length;
    }

    // Original fallback logic
    if (typeof parsed === 'string') {
        return splitTextItems(parsed)
            .filter((item) => !isExcludedDocument(item))
            .reduce((sum, item) => sum + countDocumentName(item), 0);
    }
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const required = Array.isArray(obj.required) ? getDocumentCount(obj.required) : 0;
        const optional = Array.isArray(obj.optional) ? getDocumentCount(obj.optional) : 0;
        const items = Array.isArray(obj.items) ? getDocumentCount(obj.items) : 0;
        return required + optional + items;
    }
    return 0;
}
