import axiosInstance from './base';

export const caregiverApi = {
  getCaregivers: async () => {
    const res = await axiosInstance.get('/caregiver');
    return res.data;
  },
  addCaregiver: async (data: { caregiverName: string; caregiverPhone: string; relation: string; permissions?: any }) => {
    const res = await axiosInstance.post('/caregiver', data);
    return res.data;
  },
  updateCaregiver: async (id: string, data: { caregiverName?: string; relation?: string; permissions?: any }) => {
    const res = await axiosInstance.put(`/caregiver/${id}`, data);
    return res.data;
  },
  removeCaregiver: async (id: string) => {
    const res = await axiosInstance.delete(`/caregiver/${id}`);
    return res.data;
  },
  getInvitations: async (phone?: string) => {
    console.log("Fetching caregiver invitations for phone:", phone);

    const res = await axiosInstance.get('/caregiver/invitations', { params: { phone } });
    return res.data;
  },
  respondToInvitation: async (id: string, status: 'accepted' | 'rejected') => {
    const res = await axiosInstance.post(`/caregiver/invitations/${id}/respond`, { status });
    return res.data;
  }
};
