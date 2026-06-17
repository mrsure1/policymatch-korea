import { create } from 'zustand';
import { UserProfile } from './mockPolicies';

interface UserProfileStore {
    profile: UserProfile;
    /** 사용자가 "내 조건"으로 저장해 둔 프로필 (localStorage에 영구 저장) */
    savedProfile: UserProfile | null;
    isOnboardingComplete: boolean;
    /** localStorage에서 저장된 조건을 불러왔는지 여부 */
    hydrated: boolean;
    updateProfile: (updates: Partial<UserProfile>) => void;
    completeOnboarding: () => void;
    resetProfile: () => void;
    /** 현재 입력한 조건을 "내 조건"으로 저장 */
    saveProfileAsMine: () => void;
    /** 저장해 둔 "내 조건"으로 현재 프로필을 되돌림 */
    applySavedProfile: () => void;
    /** 저장해 둔 "내 조건" 삭제 */
    clearSavedProfile: () => void;
    /** 앱 로드 시 localStorage에서 저장된 조건을 불러와 반영 */
    hydrateFromStorage: () => void;
}

const initialProfile: UserProfile = {
    entityType: '',
    age: '',
    region: '',
    industry: '',
    businessPeriod: '',
};

const STORAGE_KEY = 'policymatch:saved-profile';

function readSavedProfile(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        return { ...initialProfile, ...parsed };
    } catch {
        return null;
    }
}

function writeSavedProfile(profile: UserProfile | null) {
    if (typeof window === 'undefined') return;
    try {
        if (profile) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        /* localStorage 사용 불가 환경은 무시 */
    }
}

export const useUserProfileStore = create<UserProfileStore>((set, get) => ({
    profile: initialProfile,
    savedProfile: null,
    isOnboardingComplete: false,
    hydrated: false,

    updateProfile: (updates) =>
        set((state) => ({
            profile: { ...state.profile, ...updates },
        })),

    completeOnboarding: () => set({ isOnboardingComplete: true }),

    resetProfile: () =>
        set({
            profile: initialProfile,
            isOnboardingComplete: false,
        }),

    saveProfileAsMine: () => {
        const current = get().profile;
        writeSavedProfile(current);
        set({ savedProfile: { ...current } });
    },

    applySavedProfile: () => {
        const saved = get().savedProfile;
        if (!saved) return;
        set({ profile: { ...saved }, isOnboardingComplete: true });
    },

    clearSavedProfile: () => {
        writeSavedProfile(null);
        set({ savedProfile: null });
    },

    hydrateFromStorage: () => {
        if (get().hydrated) return;
        const saved = readSavedProfile();
        if (saved) {
            // 저장된 조건이 있으면 바로 해당 조건으로 매칭 결과를 보여준다.
            set({
                savedProfile: saved,
                profile: { ...saved },
                isOnboardingComplete: true,
                hydrated: true,
            });
        } else {
            set({ hydrated: true });
        }
    },
}));
