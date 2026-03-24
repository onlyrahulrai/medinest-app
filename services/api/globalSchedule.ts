import axiosInstance from './base';

export interface GlobalSchedule {
  times: string[];
  updatedAt: string;
}

export interface UpdateGlobalScheduleInput {
  times: string[];
}

export const globalScheduleService = {
  getGlobalSchedule: async (): Promise<GlobalSchedule> => {
    const response = await axiosInstance.get<GlobalSchedule>('/schedule/global');
    return response.data;
  },

  updateGlobalSchedule: async (data: UpdateGlobalScheduleInput): Promise<GlobalSchedule> => {
    const response = await axiosInstance.put<GlobalSchedule>('/schedule/global', data);
    return response.data;
  },
};

export async function fetchGlobalSchedule() {
  return globalScheduleService.getGlobalSchedule();
}

export async function updateGlobalSchedule(times: string[]) {
  return globalScheduleService.updateGlobalSchedule({ times });
}
