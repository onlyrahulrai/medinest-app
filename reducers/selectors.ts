import { RootState } from '../store/index';

// Auth selectors
export const selectAuthState = (state: RootState) => state.auth;

export const selectUser = (state: RootState) => state.auth.user;

export const selectAccessToken = (state: RootState) => state.auth.access;

export const selectOnboarding = (state: RootState) => state.auth.onboarding;

export const selectIsSessionRestoring = (state: RootState) => state.auth.isSessionRestoring;

export const selectIsOnboardingCompleted = (state: RootState) =>
    state.auth.onboarding?.completed || false;

export const selectCurrentOnboardingStep = (state: RootState) =>
    state.auth.onboarding?.step || 1;

export const selectIsAuthenticated = (state: RootState) =>
    !!state.auth.access && !!state.auth.user;
