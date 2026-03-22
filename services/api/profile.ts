import { apiRequest, isApiConfigured } from './client';
import { UserProfile } from '../../utils/storage';

type RemoteCaregiver = {
  userId?: string;
  name?: string;
  phoneNumber?: string;
  relation?: string;
  verificationStatus?: string;
  inviteStatus?: string;
};

type RemoteUserProfile = {
  _id?: string;
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  weight?: number;
  gender?: 'Male' | 'Female' | 'Other';
  conditions?: string[];
  isOnboardingCompleted?: boolean;
  onboardingStep?: number;
  preferences?: {
    reminderTimes?: string[];
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    shareActivityWithCaregiver?: boolean;
  };
  caregiverContacts?: RemoteCaregiver[];
};

export type SaveOnboardingProfilePayload = {
  name: string;
  dateOfBirth: string;
  gender: string;
  weight: string;
  conditions: string[];
  caregivers: Array<{
    name: string;
    phoneNumber: string;
    relation: string;
  }>;
  preferences: {
    reminderTimes: string[];
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    shareActivityWithCaregiver: boolean;
  };
  isOnboardingCompleted: boolean;
  onboardingStep?: number;
  languages?: string[];
};

export function mapRemoteProfileToLocalProfile(remote: RemoteUserProfile): UserProfile {
  return {
    id: remote._id,
    name: remote.name ?? '',
    dateOfBirth: remote.dateOfBirth ? new Date(remote.dateOfBirth).toISOString() : '',
    gender: remote.gender ?? '',
    weight: remote.weight !== undefined && remote.weight !== null ? String(remote.weight) : '',
    conditions: remote.conditions ?? [],
    phoneNumber: remote.phone ?? '',
    caregivers: (remote.caregiverContacts ?? []).map((caregiver, index) => ({
      id: caregiver.userId || `${caregiver.phoneNumber || 'caregiver'}-${index}`,
      name: caregiver.name ?? '',
      phoneNumber: caregiver.phoneNumber ?? '',
      relation: caregiver.relation ?? '',
    })),
    managedPatients: [],
    reminderTimes: remote.preferences?.reminderTimes ?? ['08:00', '20:00'],
    soundEnabled: remote.preferences?.soundEnabled ?? true,
    vibrationEnabled: remote.preferences?.vibrationEnabled ?? true,
    shareActivityWithCaregiver: remote.preferences?.shareActivityWithCaregiver ?? true,
    isOnboardingCompleted: remote.isOnboardingCompleted ?? false,
    onboardingStep: remote.onboardingStep,
  };
}

export async function fetchCurrentUserProfile() {
  return apiRequest<RemoteUserProfile>('/auth/user-details');
}

export async function saveOnboardingProfile(payload: SaveOnboardingProfilePayload) {
  console.log('Saving onboarding profile with payload:', payload);

  return apiRequest<RemoteUserProfile>('/auth/onboarding-profile', {
    method: 'PUT',
    body: payload,
  });
}