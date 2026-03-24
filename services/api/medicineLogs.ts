import axiosInstance from "./base";

export interface MedicineLog {
  _id: string;
  userId: string;
  medicineId: any; // Populated
  routineId?: any; // Populated
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  notes?: string;
  takenAt?: string;
}

export const getTodaysLogs = async (patientId?: string): Promise<MedicineLog[]> => {
  const response = await axiosInstance.get("/medicine-logs/today", {
    params: { patientId }
  });
  return response.data;
};

export const updateLogStatus = async (id: string, data: { status: 'taken' | 'skipped' | 'missed', notes?: string }): Promise<MedicineLog> => {
  const response = await axiosInstance.put(`/medicine-logs/${id}/status`, data);
  return response.data;
};
