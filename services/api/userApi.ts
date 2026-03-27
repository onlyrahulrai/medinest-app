import axiosInstance from './base';

export const userApi = {
  checkUserExists: async (phone: string) => {
    const res = await axiosInstance.get('/users/check-exists', { params: { phone } });
    return res.data;
  }
};
