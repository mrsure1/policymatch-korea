import type { PolicyRoadmapStep, PolicyDocument } from '@/lib/mockPolicies';

function decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&apos;/gi, "'")
        .replace(/&#039;/gi, "'")
        .replace(/&nbsp;/gi, ' ');
}

function stripHtml(html: string): string {
    if (!html) return '';
    return decodeHtmlEntities(
        html
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<\/?(div|p|h[1-6]|li|tr|br|ul|ol|table|section|article|aside|header|footer)[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
    )
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
}

export function getPolicySummary(summary: string | undefined, detailContent?: string): string {
    const genericSummaryPattern = /(요약정보\s*없음|요약정보가\s*없습니다|상세\s*내용\s*참조|내용\s*참조|공고문\s*참조|홈페이지\s*참조)/i;
    // 1. If valid summary exists, use it
    if (summary && summary.trim().length > 10 && !genericSummaryPattern.test(summary)) return summary;

    if (!detailContent) return '';

    // 2. Strip HTML tags and clean whitespace
    // Replace newlines with spaces for summary extraction to treat as one block
    const stripped = stripHtml(detailContent).replace(/\n/g, ' ');

    if (!stripped || stripped.length < 5) return '';

    // 3. Highest priority: "모집계획 ... 공고합니다" announcement sentence
    // Example target:
    // "성실한 실패 경험 ... 「2026년도 ... 모집계획」을 다음과 같이 공고합니다."
    const planAnnouncementRegex = /([^.!?]*(?:모집계획|모집\s*공고)[^.!?]*(?:다음과\s*같이\s*)?공고합니다\.?)/i;
    const planAnnouncementMatch = stripped.match(planAnnouncementRegex);

    if (planAnnouncementMatch && planAnnouncementMatch[1]) {
        const planText = planAnnouncementMatch[1]
            .replace(/\s+/g, ' ')
            .trim();
        if (planText.length > 20) {
            return planText;
        }
    }

    // 4. Try to extract introductory announcement (fallback)
    // Matches text ending in "공고합니다", "모집합니다" etc. allowing for "다음과 같이" before it.
    // Capture the *entire* sentence structure leading up to it. 
    // Relaxed regex to catch "2026년 ... 공고합니다" even if separated by random chars
    const introRegex = /([^.!?]*(?:모집|공고|시행|안내)[^.!?]*(?:합니다|하오니|바랍니다)[\.]?)/i;
    const introMatch = stripped.match(introRegex);

    if (introMatch && introMatch[1]) {
        let introText = introMatch[1].trim();
        introText = introText.replace(/\s+/g, ' ').trim();

        // If the captured text is substantial, return it
        if (introText.length > 20) {
            return introText;
        }
    }

    // 5. Try keywords (Content sections)
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

    // 6. Last Resort Fallback: Just take the first clean chunk of text
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
const DOCUMENT_KEYWORD_PATTERN = /(신청서|계획서|동의서|증명서|확약서|등록증|등본|명부|보고서|제안서|서류|자료|증빙|사본|원본|PPT|PDF|HWP|확인서)/;

function isInvalidDocumentName(name: string): boolean {
    if (!name) return true;
    const trimmed = name.trim();
    if (trimmed.length < 2) return true;
    if (/^[a-zA-Z0-9_./-]+$/.test(trimmed) && trimmed.length < 30) return true;
    if (/https?:\/\/|www\./i.test(trimmed)) return true;
    if (/^\d+$/.test(trimmed)) return true;
    return false;
}

function isSubDescriptionLine(line: string): boolean {
    if (!line) return true;
    const t = line.trim();
    if (/https?:\/\//i.test(t)) return true;
    if (/의\s*경우\s*(제출|불필요|해당|x)/i.test(t)) return true;
    if (/(?:작성\s*후\s*제출|접속\s*후|스캔\s*등|압축파일로\s*제출|확인증\s*제출\s*필수)/i.test(t)) return true;
    if (/^공고에\s*첨부된/.test(t)) return true;
    if ((t.match(/,/g) || []).length >= 2 && /등\s*$/.test(t)) return true;
    if (t.length < 12 && /등\s*$/.test(t)) return true;
    if (/^(상기|압축파일|제출하신|※|참고사항|문의)/.test(t)) return true;
    if (/모두\s*스캔|압축파일로|압축파일명/.test(t)) return true;
    // 제출 방법 안내: "변환하여", "병합하여", "~하여 제출"
    if (/(?:변환하여|병합하여|하여\s*제출|로\s*제출$)/i.test(t)) return true;
    // 금지/제한/주의: "설정 불가", "불이익"
    if (/(?:설정\s*불가|불이익|미비\s*시)/i.test(t)) return true;
    // 작성 안내: "이내로 작성", "양식을 사용"
    if (/(?:이내로\s*작성|양식을\s*사용)/i.test(t)) return true;
    // 파일 형식/제출 방식 안내
    if (/(?:파일\s*및\s*메일|PDF\s*파일로\s*변환|제목\s*동일\s*설정)/i.test(t)) return true;
    // 모아 찍기, 페이지 설정 등 인쇄/파일 관련 안내
    if (/(?:모아\s*찍기|페이지\s*설정)/i.test(t)) return true;
    return false;
}

function isInstructionOrNotice(line: string): boolean {
    const t = line.trim();
    if (/^상기\s*\d+/.test(t)) return true;
    if (/모두\s*스캔\s*등을\s*하여/.test(t)) return true;
    if (/압축파일명\s*[:：]/.test(t)) return true;
    if (DOCUMENT_EXCLUDE_PATTERN.test(t)) return true;
    if (/^(※|제출하신\s*서류|참고사항)/.test(t)) return true;
    return false;
}

function isDocumentSectionTitle(line: string): boolean {
    const t = line.trim();
    if (/(?:제출|신청|구비|필수|필요|증빙)\s*서류/.test(t) && !/\d+\s*부/.test(t)) return true;
    if (/서류\s*(?:안내|목록|제출)/.test(t)) return true;
    return false;
}

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

    // Protect bracketed translations like "(Consent to provision, use, and collection...)"
    // so punctuation inside brackets does not split one document into multiple items.
    const protectedTokens: string[] = [];
    const protectedText = cleaned.replace(/\([^()]*\)|\[[^\]]*\]|「[^」]*」/g, (segment) => {
        const token = `__DOC_TOKEN_${protectedTokens.length}__`;
        protectedTokens.push(segment);
        return token;
    });

    const restoreTokens = (value: string) =>
        value.replace(/__DOC_TOKEN_(\d+)__/g, (_, index) => protectedTokens[Number(index)] || '');

    const commaParts = protectedText
        .split(/\s*(?:,|·|ㆍ|;|\/)\s*/g)
        .map((part) => part.trim())
        .filter(Boolean)
        .map(restoreTokens);

    const results: string[] = [];
    for (const part of commaParts) {
        const andProtectedTokens: string[] = [];
        const andProtectedPart = part.replace(/\([^()]*\)|\[[^\]]*\]|「[^」]*」/g, (segment) => {
            const token = `__DOC_AND_TOKEN_${andProtectedTokens.length}__`;
            andProtectedTokens.push(segment);
            return token;
        });

        const andParts = andProtectedPart
            .split(/\s+및\s+/)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => item.replace(/__DOC_AND_TOKEN_(\d+)__/g, (_, index) => andProtectedTokens[Number(index)] || ''));

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

    // If text looks like "1. Step 2. Step"
    // Use regex that matches "1." or "1)" but limits digits to 1-2 to avoid years (e.g. 2026.)
    // Also requires space after dot/paren
    const numberingRegex = /(?:^|\s)\d{1,2}[\.)]\s+/;
    if (numberingRegex.test(cleaned)) {
        return cleaned.split(numberingRegex).map(s => s.trim()).filter(Boolean);
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
        const rawName = doc?.name || '';
        const name = decodeHtmlEntities(rawName);
        if (isExcludedDocument(name)) continue;
        if (isInvalidDocumentName(name)) continue;
        if (isDocumentSectionTitle(name)) continue;
        if (isSubDescriptionLine(name)) continue;
        if (isInstructionOrNotice(name)) continue;
        const parts = splitDocumentName(name);
        if (parts.length <= 1) {
            expanded.push({ ...doc, name });
            continue;
        }
        for (const part of parts) {
            const decoded = decodeHtmlEntities(part);
            if (!isInvalidDocumentName(decoded) && !isSubDescriptionLine(decoded) && !isInstructionOrNotice(decoded)) {
                expanded.push({ ...doc, name: decoded });
            }
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
            title: title.replace(/^\d+[\.)]\s*/, ''),
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

    // 제출서류 섹션 찾기
    const docKeywords = ['제출서류', '신청서류', '구비서류', '필수서류', '신청 시 요청하는 정보'];
    let docText = '';

    for (const keyword of docKeywords) {
        // Removed \n\d+\. from stop condition to avoid stopping at the numbered list of documents itself
        const regex = new RegExp(`${keyword}[:\\s]*(?:\\n|\\s|$)([\\s\\S]*?)(?:\\n[가-힣]+(?:절차|방법|안내|문의|사항)|$)`, 'i');
        const match = stripped.match(regex);
        if (match && match[1]) {
            docText = match[1].trim();
            break;
        }
    }

    if (!docText) return [];

    docText = docText.replace(/인베스트 경기 지침 참고/g, '');
    docText = docText.replace(/개인정보포함/g, '');

    const lines = docText.split('\n').map(l => l.trim()).filter(Boolean);
    const result: PolicyDocument[] = [];

    // 불릿(•·)과 하이픈(-) 둘 다 쓰인 경우: 하이픈 줄은 상위 항목의 하위 설명
    const hasBullets = lines.some(l => /^[•·]/.test(l));
    const hasHyphens = lines.some(l => /^[-–—]\s/.test(l));
    const hyphenIsSub = hasBullets && hasHyphens;

    for (let i = 0; i < lines.length; i++) {
        let line = decodeHtmlEntities(lines[i]);

        if (isInstructionOrNotice(line)) continue;

        if (hyphenIsSub && /^[-–—]\s/.test(line)) continue;

        // 번호/불릿 제거 (숫자, 기호, 한글 번호 가./나./다./...)
        line = line.replace(/^(?:\d+[\.)]|[-•·*]|[가-힣][\.)]\s)\s*/, '').trim();
        if (!line) continue;

        if (isDocumentSectionTitle(line)) continue;

        if (isInstructionOrNotice(line)) continue;
        if (isInvalidDocumentName(line)) continue;
        if (isSubDescriptionLine(line)) continue;

        // 쉼표로 구분된 서류 (예: "지방세, 국세 완납 증명서")
        const parts = splitDocumentName(line);
        if (parts.length > 1) {
            // 쉼표 분리 결과 중 유효한 서류 제목만
            const validParts = parts
                .map(decodeHtmlEntities)
                .filter((p) => !isInvalidDocumentName(p) && !isSubDescriptionLine(p));

            if (validParts.length > 0) {
                // 전체를 하나의 서류명으로 취급할지, 개별로 나눌지 판단
                // 원래 줄 전체에 서류 키워드가 있으면 하나로 합침
                // (예: "지방세, 국세 완납 증명서" → 하나)
                if (DOCUMENT_KEYWORD_PATTERN.test(line)) {
                    result.push({
                        name: decodeHtmlEntities(line),
                        category: '필수',
                        whereToGet: '공고문 바로가기에서 첨부파일 확인',
                    });
                } else {
                    for (const part of validParts) {
                        result.push({
                            name: part,
                            category: '필수',
                            whereToGet: '공고문 바로가기에서 첨부파일 확인',
                        });
                    }
                }
            }
            continue;
        }

        // 단일 서류 제목 판별
        const looksLikeDocTitle = DOCUMENT_KEYWORD_PATTERN.test(line) ||
            (/[가-힣]/.test(line) && line.length < 60 && !/의\s*경우/.test(line));

        if (looksLikeDocTitle) {
            result.push({
                name: decodeHtmlEntities(line),
                category: '필수',
                whereToGet: '공고문 바로가기에서 첨부파일 확인',
            });
        }
    }

    if (result.length === 0) {
        const docNames = splitDocumentName(docText)
            .map(decodeHtmlEntities)
            .filter((n) => !isInvalidDocumentName(n) && !isSubDescriptionLine(n) && !isInstructionOrNotice(n));
        return docNames.map((name) => ({
            name,
            category: '필수' as const,
            whereToGet: '공고문 바로가기에서 첨부파일 확인',
        }));
    }

    return result;
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
