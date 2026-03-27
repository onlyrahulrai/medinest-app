import axiosInstance from "./base";

export const authService = {
    loginWithOtp: async (phone: string, otp: string) => {
        const response = await axiosInstance.post('/auth/login-with-otp', { phone, otp });

        return response.data;
    },

    sendOtp: async (phone: string) => {
        const response = await axiosInstance.post('/auth/send-phone-otp', { phone });
        return response.data;
    },

    editProfile: async (data: Record<string, any>) => {
        const response = await axiosInstance.put('/auth/edit-profile', data);

        return response.data;
    },

    // You can add other auth related methods here as needed
    getProfile: async () => {
        const response = await axiosInstance.get('/auth/user-details');

        return response.data;
    },

    logout: async () => {
        const response = await axiosInstance.post('/auth/logout');

        return response.data;
    }
};
