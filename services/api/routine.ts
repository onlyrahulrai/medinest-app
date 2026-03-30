import axiosInstance from "./base";

export interface Routine {
  _id: string;
  name: string;
  time: string;
  isActive: boolean;
}

export default {
  getRoutines: async (): Promise<Routine[]> => {
    const response = await axiosInstance.get("/routines");
    return response.data;
  },
  getRoutineById: async (id: string): Promise<Routine> => {
    const response = await axiosInstance.get(`/routines/${id}`);
    return response.data;
  },
  createRoutine: async (data: { name: string; time: string }): Promise<Routine> => {
    const response = await axiosInstance.post("/routines", data);
    return response.data;
  },
  updateRoutine: async (id: string, data: Partial<{ name: string; time: string }>): Promise<Routine> => {
    const response = await axiosInstance.put(`/routines/${id}`, data);
    return response.data;
  },
  deleteRoutine: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/routines/${id}`);
  },
}

export const getRoutines = async (): Promise<Routine[]> => {
  const response = await axiosInstance.get("/routine");
  return response.data;
};

export const createRoutine = async (data: { name: string; time: string }): Promise<Routine> => {
  const response = await axiosInstance.post("/routine", data);
  return response.data;
};

export const updateRoutine = async (id: string, data: Partial<{ name: string; time: string }>): Promise<Routine> => {
  const response = await axiosInstance.put(`/routine/${id}`, data);
  return response.data;
};

export const deleteRoutine = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/routine/${id}`);
};

export const setupOnboardingRoutines = async (routines: { name: string; time: string }[]): Promise<Routine[]> => {
  const response = await axiosInstance.post("/routine/setup", { routines });
  return response.data;
};
