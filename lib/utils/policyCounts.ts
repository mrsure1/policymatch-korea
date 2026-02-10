import type { PolicyRoadmapStep, PolicyDocument } from '@/lib/mockPolicies';

function parseJsonValue(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

const DOCUMENT_EXCLUDE_PATTERN = /제출하신\s*서류는\s*사업운영기관에서\s*관리되오니.*$/i;
const ROADMAP_SPLIT_PATTERN = /\s*(?:,|，|·|ㆍ|;|\/|및|그리고)\s*/g;
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

    // 1. Try to find "선정절차", "평가방법", "절차" section
    const roadmapKeywords = ['선정절차 및 평가방법', '선정절차', '평가방법', '평가절차', '신청절차', '진행절차'];
    let roadmapText = '';

    for (const keyword of roadmapKeywords) {
        const regex = new RegExp(`${keyword}[^\\n]*\\n+([\\s\\S]*?)(?:\\n\\n|$)`, 'i');
        const match = detailContent.match(regex);
        if (match && match[1]) {
            roadmapText = match[1].trim();
            break;
        }
    }

    if (!roadmapText && detailContent.length > 0) {
        // Fallback: try to find lines that look like steps (1. 2. 3. or - - -) if content is short enough to be just the roadmap?
        // Or just don't guess too wildly to avoid noise.
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

    // 2. Try to find "제출서류", "신청서류", "구비서류" section
    const docKeywords = ['제출서류', '신청서류', '구비서류', '필수서류'];
    let docText = '';

    // Look for section headers
    for (const keyword of docKeywords) {
        // Find keyword followed by content, stopping at next double newline or end of common sections
        const regex = new RegExp(`${keyword}[^\\n]*\\n+([\\s\\S]*?)(?:\\n\\n|\\n[가-힣]+(?:절차|방법|안내|문의)|$)`, 'i');
        const match = detailContent.match(regex);
        if (match && match[1]) {
            docText = match[1].trim();
            break;
        }
    }

    if (docText) {
        // Remove common disclaimer text in document section
        docText = docText.replace(/제출하신\s*서류는\s*사업운영기관에서\s*관리되오니.*$/i, '');
        docText = docText.replace(/인베스트 경기 지침 참고/g, ''); // Specific noise removal

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
