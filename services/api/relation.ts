import axiosInstance from './base';

export default {
    getRelations: async (params?: { role?: string }) => {
        const res = await axiosInstance.get('/caregiver/relations', { params });

        return res.data;
    },
    getRelationDetails: async (id: string) => {
        const res = await axiosInstance.get(`/caregiver/relations/${id}`);

        return res.data;
    },
    updateRelation: async (id: string, data: { caregiverName?: string; relation?: string; }) => {
        const res = await axiosInstance.put(`/caregiver/relations/${id}`, data);

        return res.data;
    },
    removeRelation: async (id: string) => {
        const res = await axiosInstance.delete(`/caregiver/relations/${id}`);

        return res.data;
    },
};
