import axiosInstance from './base';
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
  // These come nested inside `profile` from the backend
  profile?: {
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    weight?: number;
    conditions?: string[];
    allergies?: string[];
    bloodGroup?: string;
    height?: number;
    pic?: string;
    bio?: string;
    address?: string;
  };
  // These may also appear at top-level in some responses (e.g., after edit-profile returns flattened data)
  dateOfBirth?: string;
  weight?: number;
  gender?: 'Male' | 'Female' | 'Other';
  conditions?: string[];
  onboarding?: {
    completed?: boolean;
    step?: number;
  };
  isOnboardingCompleted?: boolean;
  routinesEnabled?: boolean;
  languages?: string[];
  preferences?: {
    reminderTimes?: string[];
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    shareActivityWithCaregiver?: boolean;
  };
  caregiverContacts?: RemoteCaregiver[];
  managedPatients?: Array<{
    _id: string;
    name: string;
    phone: string;
  }>;
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
  // Handle both nested (from DB) and flat (from some endpoints) response shapes
  const dateOfBirth = remote.profile?.dateOfBirth || remote.dateOfBirth;
  const gender = remote.profile?.gender || remote.gender;
  const weight = remote.profile?.weight ?? remote.weight;
  const conditions = remote.profile?.conditions || remote.conditions;
  const isOnboardingCompleted = remote.onboarding?.completed ?? remote.isOnboardingCompleted ?? false;

  return {
    id: remote._id,
    name: remote.name ?? '',
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : '',
    gender: gender ?? '',
    weight: weight !== undefined && weight !== null ? String(weight) : '',
    conditions: conditions ?? [],
    phoneNumber: remote.phone ?? '',
    caregivers: (remote.caregiverContacts ?? []).map((caregiver, index) => ({
      id: caregiver.userId || `${caregiver.phoneNumber || 'caregiver'}-${index}`,
      name: caregiver.name ?? '',
      phoneNumber: caregiver.phoneNumber ?? '',
      relation: caregiver.relation ?? '',
      inviteStatus: caregiver.inviteStatus as any,
      verificationStatus: caregiver.verificationStatus as any,
    })),
    managedPatients: (remote.managedPatients ?? []).map(p => ({
      id: p._id,
      name: p.name ?? '',
      phoneNumber: p.phone ?? '',
    })),
    reminderTimes: remote.preferences?.reminderTimes ?? ['08:00', '20:00'],
    soundEnabled: remote.preferences?.soundEnabled ?? true,
    vibrationEnabled: remote.preferences?.vibrationEnabled ?? true,
    shareActivityWithCaregiver: remote.preferences?.shareActivityWithCaregiver ?? true,
    isOnboardingCompleted,
  };
}

export const profileService = {
  fetchCurrentUserProfile: async (): Promise<RemoteUserProfile> => {
    const response = await axiosInstance.get<RemoteUserProfile>('/auth/user-details');

    return response.data;
  },

  saveOnboardingProfile: async (payload: SaveOnboardingProfilePayload): Promise<RemoteUserProfile> => {
    // Transform frontend payload into backend EditProfileInput shape
    const editPayload = {
      name: payload.name,
      onboarding: {
        completed: payload.isOnboardingCompleted,
        step: payload.onboardingStep,
      },
      profile: {
        dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : undefined,
        gender: payload.gender as 'Male' | 'Female' | 'Other' | undefined,
        weight: payload.weight ? Number(payload.weight) : undefined,
        conditions: payload.conditions,
      },
      languages: payload.languages,
      preferences: payload.preferences,
      caregivers: payload.caregivers?.map(c => ({
        name: c.name,
        phone: c.phoneNumber,
        relation: c.relation,
      })),
    };
    const response = await axiosInstance.put<RemoteUserProfile>('/auth/edit-profile', editPayload);

    return response.data;
  },
};

export async function fetchCurrentUserProfile() {
  return profileService.fetchCurrentUserProfile();
}

export async function saveOnboardingProfile(payload: SaveOnboardingProfilePayload) {
  return profileService.saveOnboardingProfile(payload);
}