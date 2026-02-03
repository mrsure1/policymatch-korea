'use client';

import { useUserProfileStore } from '@/lib/store';
import { matchPolicies } from '@/lib/mockPolicies';
import { checkApiStatus } from '@/lib/api/publicDataApi';
import OnboardingForm from '@/components/OnboardingForm';
import PolicyCard from '@/components/PolicyCard';
import EditableTag from '@/components/EditableTag';
import { RefreshCw, User, Info } from 'lucide-react';

export default function HomePage() {
  const { profile, isOnboardingComplete, resetProfile, updateProfile } = useUserProfileStore();

  if (!isOnboardingComplete) {
    return <OnboardingForm />;
  }

  const matchedPolicies = matchPolicies(profile);
  const apiStatus = checkApiStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">정책자금 매칭</h1>
            <p className="text-sm text-slate-600">나에게 딱 맞는 정부 지원 정책</p>
          </div>
          <button
            onClick={resetProfile}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-slate-300 hover:border-blue-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-semibold">다시 시작</span>
          </button>
        </div>
      </header>

      {/* User Profile Summary */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-2">내 프로필</h2>
              <p className="text-xs text-slate-500 mb-3">클릭하여 조건을 변경하면 즉시 매칭 결과가 업데이트됩니다</p>
              <div className="flex flex-wrap gap-2">
                {profile.entityType && (
                  <EditableTag
                    label=""
                    value={profile.entityType}
                    options={['예비창업자', '소상공인', '중소기업']}
                    onChange={(value) => updateProfile({ entityType: value })}
                    color="blue"
                  />
                )}
                {profile.age && (
                  <EditableTag
                    label=""
                    value={profile.age}
                    options={['청년 (39세 이하)', '중장년 (40-64세)', '시니어 (65세 이상)']}
                    onChange={(value) => updateProfile({ age: value })}
                  />
                )}
                {profile.region && (
                  <EditableTag
                    label=""
                    value={profile.region}
                    options={['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']}
                    onChange={(value) => updateProfile({ region: value })}
                  />
                )}
                {profile.industry && (
                  <EditableTag
                    label=""
                    value={profile.industry}
                    options={['IT/소프트웨어', '제조업', '서비스업', '도소매업', '음식/숙박업', '건설업', '교육서비스업', '기타']}
                    onChange={(value) => updateProfile({ industry: value })}
                  />
                )}
                {profile.businessPeriod && (
                  <EditableTag
                    label="사업기간"
                    value={profile.businessPeriod}
                    options={['1년 미만', '1-3년', '3-7년', '7년 이상']}
                    onChange={(value) => updateProfile({ businessPeriod: value })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* API Status Banner */}
        <div className={`mb-6 p-4 rounded-xl border-2 flex items-start gap-3 ${apiStatus.configured
          ? 'bg-green-50 border-green-200'
          : 'bg-yellow-50 border-yellow-200'
          }`}>
          <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${apiStatus.configured ? 'text-green-600' : 'text-yellow-600'
            }`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${apiStatus.configured ? 'text-green-900' : 'text-yellow-900'
              }`}>
              {apiStatus.configured ? '✓ API 연동 완료' : '⚠ 목 데이터 사용 중'}
            </p>
            <p className={`text-xs mt-1 ${apiStatus.configured ? 'text-green-700' : 'text-yellow-700'
              }`}>
              {apiStatus.configured
                ? '공공데이터 API가 설정되었습니다. K-Startup API 승인 후 실제 정책자금 데이터를 사용할 수 있습니다.'
                : '현재 샘플 데이터를 사용하고 있습니다. .env.local 파일에 API 키를 설정해주세요.'}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900">
            매칭된 정책 <span className="text-blue-600">{matchedPolicies.length}개</span>
          </h2>
          <p className="text-slate-600 mt-1">
            회원님의 프로필과 일치하는 정부 지원 정책입니다
          </p>
        </div>

        {matchedPolicies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedPolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
            <p className="text-slate-600 mb-2">현재 프로필과 일치하는 정책이 없습니다</p>
            <p className="text-sm text-slate-500">프로필을 다시 설정해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
