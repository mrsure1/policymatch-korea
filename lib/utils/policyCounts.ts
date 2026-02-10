import type { PolicyRoadmapStep } from '@/lib/mockPolicies';

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

export function getRoadmapCount(value: unknown): number {
    const parsed = parseJsonValue(value);
    if (Array.isArray(parsed)) return normalizeRoadmapSteps(parsed as PolicyRoadmapStep[]).length;
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

export function getDocumentCount(value: unknown): number {
    const parsed = parseJsonValue(value);
    if (Array.isArray(parsed)) {
        return filterDocumentsArray(parsed).reduce<number>((sum, item) => {
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
