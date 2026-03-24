import axiosInstance from "./base";

export interface Routine {
  _id: string;
  name: string;
  time: string;
  isActive: boolean;
}

export const getRoutines = async (): Promise<Routine[]> => {
  const response = await axiosInstance.get("/routines");
  return response.data;
};

export const createRoutine = async (data: { name: string; time: string }): Promise<Routine> => {
  const response = await axiosInstance.post("/routines", data);
  return response.data;
};

export const updateRoutine = async (id: string, data: Partial<{ name: string; time: string }>): Promise<Routine> => {
  const response = await axiosInstance.put(`/routines/${id}`, data);
  return response.data;
};

export const deleteRoutine = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/routines/${id}`);
};

export const setupOnboardingRoutines = async (routines: { name: string; time: string }[]): Promise<Routine[]> => {
  const response = await axiosInstance.post("/routines/setup", { routines });
  return response.data;
};
