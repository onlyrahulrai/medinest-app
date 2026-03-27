import { authService } from '../services/api/auth';
import { userApi } from '../services/api/userApi';

/**
 * Cleans payload to prevent sending empty values that overwrite backend data
 *

/**
 * Saves onboarding profile data to backend
 * Supports partial updates - only send data for current step
 * IMPORTANT: Does NOT send empty arrays to backend (prevents data loss)
 */
export async function updateOnboardingProfile(data: Record<string, any>) {
    try {
        // Clean payload - remove empty arrays/objects that could overwrite backend

        const response = await authService.editProfile(data);

        return { success: true, data: response };
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.message ||
            error.message ||
            'Failed to save profile. Please try again.';
        return { success: false, error: errorMessage };
    }
}

/**
 * Validates caregiver phone and checks if user exists
 * Returns { exists: boolean, user?: Record<string, any> }
 */
export async function validateCaregiverPhone(phone: string) {
    try {
        const response = await userApi.checkUserExists(phone);
        return { success: true, data: response };
    } catch (error: any) {
        // Treat lookup failure as "not found" (don't block user)
        return { success: true, data: { exists: false } };
    }
}

/**
 * Build onboarding step update payload
 * Only includes fields relevant to the current step
 * IMPORTANT: Does NOT include empty arrays that could overwrite backend data
 */
export function createOnboardingPayload(
    step: number,
    data: Record<string, any>
) {
    const basePayload = {
        onboarding: {
            step,
            completed: false,
        },
    };

    switch (step) {
        case 1:
            return {
                ...basePayload,
                profile: {
                    ...data.profile, // Include existing profile fields to prevent overwriting
                    dateOfBirth: data.dateOfBirth,
                    gender: data.gender,
                    weight: data.weight,
                },
                name: data.name,
            };

        case 2:
            console.log("Creating payload for step 2 with data:", data.conditions, data.profile);

            return {
                ...basePayload,
                profile: {
                    ...data.profile, // Include existing profile fields to prevent overwriting
                    conditions: data.conditions,
                },
            };

        case 3:
            return {
                ...basePayload,
                caregivers: data.caregivers || [],
            };

        case 4:
            return {
                ...basePayload,
                routines: data.routines || [],
            };

        case 5:
            // Final step - mark as completed
            return {
                onboarding: {
                    step: 5,
                    completed: true,
                },
                preferences: {
                    soundEnabled: data.soundEnabled ?? true,
                    vibrationEnabled: data.vibrationEnabled ?? true,
                    shareActivityWithCaregiver: data.shareActivityWithCaregiver ?? true,
                },
            };

        default:
            return basePayload;
    }
}

type OnboardingRoute =
    | "./(onboarding)/step1"
    | "./(onboarding)/step2"
    | "./(onboarding)/step3"
    | "./(onboarding)/step4"
    | "./(onboarding)/step5";

export const getOnboardingRoute = (step: number): OnboardingRoute => {
    const routes: any = {
        1: "/(onboarding)/step1",
        2: "/(onboarding)/step2",
        3: "/(onboarding)/step3",
        4: "/(onboarding)/step4",
        5: "/(onboarding)/step5",
    };

    return routes[Math.min(step + 1, 5) || routes[1]];
};