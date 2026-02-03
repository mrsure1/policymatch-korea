'use client';

import { useParams, useRouter } from 'next/navigation';
import { mockPolicies } from '@/lib/mockPolicies';
import RoadmapTimeline from '@/components/RoadmapTimeline';
import DocumentChecklist from '@/components/DocumentChecklist';
import { ArrowLeft, Calendar, Building2, TrendingUp, Map, FileCheck } from 'lucide-react';

export default function PolicyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const policy = mockPolicies.find(p => p.id === params.id);

    if (!policy) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">정책을 찾을 수 없습니다</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">목록으로</span>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">{policy.title}</h1>
                    <p className="text-slate-600 mt-1">{policy.agency}</p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Summary Card */}
                <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">정책 개요</h2>
                    <p className="text-slate-700 mb-6">{policy.summary}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">지원 금액</p>
                                <p className="font-bold text-slate-900">{policy.supportAmount}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">신청 기간</p>
                                <p className="font-bold text-slate-900">{policy.applicationPeriod}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">담당 기관</p>
                                <p className="font-bold text-slate-900">{policy.agency}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-red-600">D-{policy.dDay}</span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">마감까지</p>
                                <p className="font-bold text-slate-900">{policy.dDay}일 남음</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Roadmap */}
                <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                            <Map className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">신청 로드맵</h2>
                            <p className="text-sm text-slate-600">단계별 신청 가이드를 확인하세요</p>
                        </div>
                    </div>
                    <RoadmapTimeline steps={policy.roadmap} />
                </div>

                {/* Document Compass */}
                <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                            <FileCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">서류 준비 가이드</h2>
                            <p className="text-sm text-slate-600">필요한 서류를 체크하며 준비하세요</p>
                        </div>
                    </div>
                    <DocumentChecklist documents={policy.documents} />
                </div>
            </div>
        </div>
    );
}
