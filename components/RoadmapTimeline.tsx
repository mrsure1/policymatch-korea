'use client';

import { PolicyRoadmapStep } from '@/lib/mockPolicies';
import { Check, Circle } from 'lucide-react';

interface RoadmapTimelineProps {
    steps: PolicyRoadmapStep[];
}

export default function RoadmapTimeline({ steps }: RoadmapTimelineProps) {
    return (
        <div className="space-y-6">
            {steps.map((step, index) => (
                <div key={step.step} className="flex gap-4">
                    {/* Timeline Icon */}
                    <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-blue-600' : 'bg-slate-400'
                            }`}>
                            {index === 0 ? <Circle className="w-5 h-5" /> : step.step}
                        </div>
                        {index < steps.length - 1 && (
                            <div className="w-0.5 h-full min-h-[40px] bg-slate-300 mt-2" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                        <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-slate-900">{step.title}</h4>
                                {step.estimatedDays && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold whitespace-nowrap ml-2">
                                        약 {step.estimatedDays}일
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-600">{step.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
