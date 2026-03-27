import { authService } from '../services/api/auth';
import { userApi } from '../services/api/userApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hydrates language preference from AsyncStorage or defaults to 'en'
 */
export async function getLanguagePreference(): Promise<string> {
    try {
        const stored = await AsyncStorage.getItem('user-language');
        return stored || 'en';
    } catch (error) {
        console.error('Error reading language preference:', error);
        return 'en';
    }
}

/**
 * Cleans payload to prevent sending empty values that overwrite backend data
 */
function cleanPayload(payload: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(payload)) {
        // Always include onboarding status
        if (key === 'onboarding') {
            cleaned[key] = value;
            continue;
        }

        // Skip empty arrays - don't send them to backend
        if (Array.isArray(value) && value.length === 0) {
            continue;
        }

        // Skip empty objects (except specific ones)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const hasContent = Object.values(value).some(v =>
                v !== null && v !== undefined && v !== ''
            );
            if (hasContent) {
                cleaned[key] = value;
            }
            continue;
        }

        // Include everything else with non-null, non-undefined values
        if (value !== null && value !== undefined) {
            cleaned[key] = value;
        }
    }

    return cleaned;
}

/**
 * Saves onboarding profile data to backend
 * Supports partial updates - only send data for current step
 * IMPORTANT: Does NOT send empty arrays to backend (prevents data loss)
 */
export async function updateOnboardingProfile(data: Record<string, any>) {
    try {
        // Clean payload - remove empty arrays/objects that could overwrite backend
        const cleanedPayload = cleanPayload(data);

        const response = await authService.editProfile(cleanedPayload);
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
export function buildOnboardingPayload(
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
                    dateOfBirth: data.dateOfBirth,
                    gender: data.gender,
                    weight: data.weight,
                },
                name: data.name,
                // Only include languages if provided (typically only in step 1)
                ...(data.languages && data.languages.length > 0 && {
                    languages: data.languages,
                }),
            };

        case 2:
            return {
                ...basePayload,
                profile: {
                    conditions: data.conditions || [],
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
                preferences: {
                    soundEnabled: data.soundEnabled ?? true,
                    vibrationEnabled: data.vibrationEnabled ?? true,
                    shareActivityWithCaregiver: data.shareActivityWithCaregiver ?? true,
                },
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
