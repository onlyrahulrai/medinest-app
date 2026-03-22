import { apiRequest, isApiConfigured } from './client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type CaregiverLookupResult = {
  found: boolean;
  name?: string;
  userId?: string;
};

async function mockLookupCaregiverByPhone(phoneNumber: string): Promise<CaregiverLookupResult> {
  await delay(1000);

  if (phoneNumber.endsWith('0')) {
    return { found: false };
  }

  return {
    found: true,
    name: 'Verified User',
    userId: `user_${phoneNumber}`,
  };
}

export async function lookupCaregiverByPhone(phoneNumber: string): Promise<CaregiverLookupResult> {
  if (!isApiConfigured()) {
    return mockLookupCaregiverByPhone(phoneNumber);
  }

  return apiRequest<CaregiverLookupResult>(`/caregivers/lookup?phoneNumber=${encodeURIComponent(phoneNumber)}`);
}