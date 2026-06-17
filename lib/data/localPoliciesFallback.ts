import type { Policy } from '@/lib/mockPolicies';
import rootPolicies from '@/policies.json';
import { resolveKStartupOfficialUrl } from '@/lib/utils/kstartupUrl';

interface RootPolicyRecord {
    id: string;
    title: string;
    link?: string;
    source_site?: string;
    agency?: string;
    applicationPeriod?: string;
    summary?: string;
}

function normalizeSource(source?: string): string | undefined {
    if (!source) return undefined;
    const upper = source.toUpperCase();
    if (upper === 'K-STARTUP' || upper === 'KSTARTUP') return 'K-Startup';
    if (upper === 'BIZINFO' || upper === '기업마당') return '기업마당';
    return source;
}

function computeDDay(dateStr?: string): number {
    if (!dateStr) return 999;
    const normalized = dateStr.trim();
    const end = new Date(`${normalized}T23:59:59+09:00`);
    if (Number.isNaN(end.getTime())) return 999;
    return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatApplicationPeriod(dateStr?: string): string {
    if (!dateStr) return '상시';
    const normalized = dateStr.trim().replace(/-/g, '.');
    return `~ ${normalized}`;
}

export function getLocalFallbackPolicies(): Policy[] {
    return (rootPolicies as RootPolicyRecord[]).map((item) => ({
        id: String(item.id),
        title: item.title || '제목 없음',
        summary: item.summary || '',
        supportAmount: '미정',
        dDay: computeDDay(item.applicationPeriod),
        applicationPeriod: formatApplicationPeriod(item.applicationPeriod),
        agency: item.agency || '정부기관',
        sourcePlatform: normalizeSource(item.source_site),
        url: resolveKStartupOfficialUrl({
            rawUrl: item.link,
            title: item.title,
            sourceSite: item.source_site,
            policyId: item.id,
        }),
        criteria: {},
        roadmap: [],
        documents: [],
    }));
}
