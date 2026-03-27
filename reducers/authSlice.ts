import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface OnboardingStatus {
    completed: boolean;
    step: number;
}

interface AuthState {
    user: Record<string, any> | null;
    access: string | null;
    refresh: string | null;
    onboarding: OnboardingStatus | null;
    isSessionRestoring: boolean;
}

const initialState: AuthState = {
    user: null,
    access: null,
    refresh: null,
    onboarding: null,
    isSessionRestoring: true, // Start as true to prevent flash of login during boot
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSessionRestoring: (state, action: PayloadAction<boolean>) => {
            state.isSessionRestoring = action.payload;
        },
        authenticated: (state, action: PayloadAction<{
            user: Record<string, any>;
            access: string;
            refresh?: string;
            onboarding?: OnboardingStatus;
        }>) => {
            state.user = action.payload.user;
            state.access = action.payload.access;
            state.refresh = action.payload.refresh || null;
            state.onboarding = action.payload.onboarding || null;
            state.isSessionRestoring = false;
        },
        loaded: (state, action: PayloadAction<{
            user: Record<string, any>;
            access?: string;
            refresh?: string;
            onboarding?: OnboardingStatus;
        }>) => {
            state.user = action.payload.user;
            if (action.payload.access) state.access = action.payload.access;
            if (action.payload.refresh) state.refresh = action.payload.refresh;
            if (action.payload.onboarding) state.onboarding = action.payload.onboarding;
            state.isSessionRestoring = false;
        },
        updateUserProfile: (state, action: PayloadAction<Record<string, any>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        updateOnboarding: (state, action: PayloadAction<OnboardingStatus>) => {
            state.onboarding = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.access = null;
            state.refresh = null;
            state.onboarding = null;
            state.isSessionRestoring = false;
        },
        // Deprecated: kept for backward compatibility
        edit: (state, action: PayloadAction<Record<string, any>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
    }
})

export const {
    authenticated,
    loaded,
    logout,
    edit,
    setSessionRestoring,
    updateUserProfile,
    updateOnboarding,
} = authSlice.actions;

export default authSlice.reducer;