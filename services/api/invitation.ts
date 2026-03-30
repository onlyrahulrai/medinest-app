import axiosInstance from './base';

export default {
  getInvitations: async (params?: { type?: string, status?: string }) => {
    const res = await axiosInstance.get('/caregiver/invitations', { params });

    return res.data;
  },
  getInvitationDetails: async (id: string) => {
    const res = await axiosInstance.get(`/caregiver/invitations/${id}`);

    return res.data;
  },
  createInvitation: async (data: { caregiverName: string; caregiverPhone: string; relation: string; message?: string }) => {
    const res = await axiosInstance.post('/caregiver/invitations', data);
    return res.data;
  },
  deleteInvitation: async (id: string) => {
    const res = await axiosInstance.delete(`/caregiver/invitations/${id}`);
    return res.data;
  },
  respondToInvitation: async (id: string, action: 'accept' | 'reject') => {
    const res = await axiosInstance.patch(`/caregiver/invitations/${id}/respond`, { action });
    return res.data;
  },
  resendInvitation: async (id: string) => {
    const res = await axiosInstance.post(`/caregiver/invitations/${id}/resend`);
    return res.data;
  }
};
