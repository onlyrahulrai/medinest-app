import axiosInstance from './base';

export const caregiverApi = {
  getCaregivers: async (params?: { type?: string }) => {
    const res = await axiosInstance.get('/caregiver', { params });

    return res.data;
  },
  getCaregiverRelations: async (params?: { role?: string }) => {
    const res = await axiosInstance.get('/caregiver/relations', { params });

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

  getInvitations: async (params: Record<string, any>) => {
    console.log("Fetching caregiver invitations for phone:", params);

    const res = await axiosInstance.get('/caregiver/invitations', { params });

    return res.data;
  },
  respondToInvitation: async (id: string, status: 'accepted' | 'rejected') => {
    const res = await axiosInstance.post(`/caregiver/invitations/${id}/respond`, { status });
    return res.data;
  }
};
