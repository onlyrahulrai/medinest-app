import axios from "axios";
import { authStorage } from '../../utils/authStorage';

const axiosInstance = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_API_BASE_URL}`,
  timeout: 100000,
});

axiosInstance.interceptors.request.use(
  async (config: any) => {
    const token = await authStorage.getToken();

    if (token) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
