import axiosInstance from './base';

export type CaregiverLookupResult = {
  found: boolean;
  name?: string;
  userId?: string;
};

export const caregiverService = {
  lookupCaregiverByPhone: async (phoneNumber: string): Promise<CaregiverLookupResult> => {
    const response = await axiosInstance.get<CaregiverLookupResult>('/auth/caregiver-lookup', {
      params: { phoneNumber },
    });

    return response.data;
  },
  upsertInvitation: async (caregiver: { name?: string; phoneNumber: string; relation?: string }): Promise<any> => {
    const response = await axiosInstance.post('/caregivers/upsert-invitation', caregiver);
    return response.data;
  },
  removeCaregiver: async (phoneNumber: string): Promise<any> => {
    const response = await axiosInstance.delete('/caregivers/remove', {
      params: { phoneNumber },
    });
    return response.data;
  },
  getInvitations: async (phone?: string): Promise<any[]> => {
    const response = await axiosInstance.get('/caregivers/invitations', {
      params: { phone }
    });
    return response.data;
  },
  respondToInvitation: async (invitationId: string, status: 'accepted' | 'rejected'): Promise<any> => {
    const response = await axiosInstance.post('/caregivers/invitation-response', {
      invitationId,
      status
    });
    return response.data;
  }
};

export async function upsertInvitation(caregiver: { name?: string; phoneNumber: string; relation?: string }) {
  return caregiverService.upsertInvitation(caregiver);
}

export async function removeCaregiver(phoneNumber: string) {
  return caregiverService.removeCaregiver(phoneNumber);
}

export async function getInvitations(phone?: string) {
  return caregiverService.getInvitations(phone);
}

export async function respondToInvitation(invitationId: string, status: 'accepted' | 'rejected') {
  return caregiverService.respondToInvitation(invitationId, status);
}

export async function lookupCaregiverByPhone(phoneNumber: string): Promise<CaregiverLookupResult> {
  return caregiverService.lookupCaregiverByPhone(phoneNumber);
}