import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import type { PolicyFundDB } from '@/lib/supabase/client'
import type { Policy } from '@/lib/mockPolicies'

// DB 데이터 → UI 타입 변환
function mapDBToUI(dbPolicy: PolicyFundDB): Policy {
    return {
        id: String(dbPolicy.id), // 숫자 ID를 문자열로 변환
        title: dbPolicy.title,
        summary: dbPolicy.content_summary || '',
        supportAmount: dbPolicy.amount || '미정',
        dDay: dbPolicy.d_day || 999,
        applicationPeriod: dbPolicy.application_period || '상시',
        agency: dbPolicy.agency || '정부기관',
        url: dbPolicy.link || dbPolicy.url || undefined,
        mobileUrl: dbPolicy.mobile_url || undefined,
        detailContent: dbPolicy.raw_content || undefined,

        criteria: {
            entityTypes: dbPolicy.criteria?.entityTypes || [],
            ageGroups: dbPolicy.criteria?.ageGroups || [],
            regions: dbPolicy.criteria?.regions || (dbPolicy.region ? [dbPolicy.region] : []),
            industries: dbPolicy.criteria?.industries || (dbPolicy.industry ? dbPolicy.industry.split(',').map((s: string) => s.trim()) : []),
            businessPeriods: dbPolicy.criteria?.businessPeriods || (dbPolicy.biz_age ? [dbPolicy.biz_age] : []),
        },

        roadmap: dbPolicy.roadmap || [],
        documents: dbPolicy.documents || [],
    }
}

export async function GET() {
    try {
        // Supabase에서 모든 정책 데이터 가져오기
        const { data, error } = await supabase
            .from('policy_funds')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Supabase error:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch policies from database', data: [] },
                { status: 500 }
            )
        }

        // DB 데이터를 UI 타입으로 변환
        const policies: Policy[] = (data as PolicyFundDB[]).map(mapDBToUI)

        console.log(`✅ Fetched ${policies.length} policies, IDs:`, policies.map(p => p.id))

        return NextResponse.json({
            success: true,
            data: policies,
            count: policies.length,
            error: null
        })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error', data: [] },
            { status: 500 }
        )
    }
}
