function parseJsonValue(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

const DOCUMENT_EXCLUDE_PATTERN = /제출하신\s*서류는\s*사업운영기관에서\s*관리되오니.*$/i;

function splitTextItems(text: string): string[] {
    return text
        .split(/[\n\r\u2022\u00B7\-\*]+/g)
        .map((line) => line.trim())
        .filter(Boolean);
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
    return documents.filter((doc) => !isExcludedDocument(doc?.name || ''));
}

export function getRoadmapCount(value: unknown): number {
    const parsed = parseJsonValue(value);
    if (Array.isArray(parsed)) return parsed.length;
    if (typeof parsed === 'string') return splitTextItems(parsed).length;
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const candidates = [obj.steps, obj.roadmap, obj.items, obj.process, obj.procedures];
        const arr = candidates.find((item) => Array.isArray(item)) as unknown[] | undefined;
        return arr ? arr.length : 0;
    }
    return 0;
}

export function getDocumentCount(value: unknown): number {
    const parsed = parseJsonValue(value);
    if (Array.isArray(parsed)) return filterDocumentsArray(parsed).length;
    if (typeof parsed === 'string') {
        return splitTextItems(parsed).filter((item) => !isExcludedDocument(item)).length;
    }
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>;
        const required = Array.isArray(obj.required) ? filterDocumentsArray(obj.required).length : 0;
        const optional = Array.isArray(obj.optional) ? filterDocumentsArray(obj.optional).length : 0;
        const items = Array.isArray(obj.items) ? filterDocumentsArray(obj.items).length : 0;
        return required + optional + items;
    }
    return 0;
}
