import { createClient } from '@supabase/supabase-js'

export function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
        return null
    }
    return createClient(supabaseUrl, supabaseAnonKey)
}

// 타입 정의
export interface PolicyFundDB {
    id: number
    title: string
    link: string | null
    source_site: string | null
    content_summary: string | null
    region: string | null
    biz_age: string | null
    industry: string | null
    target_group: string | null
    support_type: string | null
    amount: string | null
    raw_content: string | null
    agency: string | null
    application_period: string | null
    d_day: number | null
    url: string | null
    mobile_url: string | null
    inquiry: string | null
    application_method: string | null
    roadmap: RoadmapStep[]
    documents: PolicyDocument[]
    criteria: PolicyCriteria
    created_at: string
    updated_at: string
}

export interface RoadmapStep {
    step: number
    title: string
    description: string
    estimatedDays?: number
}

export interface PolicyDocument {
    name: string
    category: '필수' | '우대/추가'
    whereToGet: string
    link?: string
}

export interface PolicyCriteria {
    entityTypes?: string[]
    ageGroups?: string[]
    regions?: string[]
    industries?: string[]
    businessPeriods?: string[]
}
