import { create } from 'zustand';
import { UserProfile } from './mockPolicies';

interface UserProfileStore {
    profile: UserProfile;
    isOnboardingComplete: boolean;
    updateProfile: (updates: Partial<UserProfile>) => void;
    completeOnboarding: () => void;
    resetProfile: () => void;
}

const initialProfile: UserProfile = {
    entityType: '',
    age: '',
    region: '',
    industry: '',
    businessPeriod: '',
};

export const useUserProfileStore = create<UserProfileStore>((set) => ({
    profile: initialProfile,
    isOnboardingComplete: false,

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
}));
