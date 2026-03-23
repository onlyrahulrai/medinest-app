import axiosInstance from './base';

export interface MedicineSchedule {
  times: string[];
  frequency: 'daily' | 'weekly' | 'custom' | 'as_needed';
  daysOfWeek?: number[];
}

export interface MedicineDuration {
  startDate: string;
  endDate?: string;
}

export interface Medicine {
  _id: string;
  userId: string;
  name: string;
  type: string;
  dosage: string;
  dosageUnit?: string;
  schedule: MedicineSchedule;
  duration: MedicineDuration;
  instructions?: string;
  notes?: string;
  mealTiming?: string[];
  prescribedBy?: string;
  purpose?: string;
  color?: string;
  imageUrl?: string;
  useGlobal: boolean;
  refillReminder?: boolean;
  currentSupply?: number;
  totalSupply?: number;
  refillAt?: number;
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  isActive: boolean;
  logs: Array<{
    takenAt: string;
    status: 'taken' | 'skipped' | 'missed';
    notes?: string;
    loggedBy: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineInput {
  name: string;
  type: string;
  dosage: string;
  dosageUnit?: string;
  schedule: MedicineSchedule;
  duration: MedicineDuration;
  instructions?: string;
  notes?: string;
  mealTiming?: string[];
  prescribedBy?: string;
  purpose?: string;
  color?: string;
  imageUrl?: string;
  useGlobal: boolean;
  refillReminder?: boolean;
  currentSupply?: number;
  totalSupply?: number;
  refillAt?: number;
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  patientId?: string;
}

export interface UpdateMedicineInput extends Partial<CreateMedicineInput> {
  isActive?: boolean;
}

export interface MedicineLogInput {
  takenAt: string;
  status: 'taken' | 'skipped' | 'missed';
  notes?: string;
  loggedBy: string;
}

export const medicineService = {
  createMedicine: async (data: CreateMedicineInput): Promise<Medicine> => {
    const response = await axiosInstance.post<Medicine>('/medicines', data);
    return response.data;
  },

  getAllMedicines: async (status?: 'active' | 'inactive', date?: string, patientId?: string): Promise<Medicine[]> => {
    const response = await axiosInstance.get<Medicine[]>('/medicines', {
      params: { status, date, patientId },
    });
    return response.data;
  },

  getMedicineById: async (id: string): Promise<Medicine> => {
    const response = await axiosInstance.get<Medicine>(`/medicines/${id}`);
    return response.data;
  },

  updateMedicine: async (id: string, data: UpdateMedicineInput): Promise<Medicine> => {
    const response = await axiosInstance.put<Medicine>(`/medicines/${id}`, data);
    return response.data;
  },

  deleteMedicine: async (id: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/medicines/${id}`);
    return response.data;
  },

  logIntake: async (id: string, log: MedicineLogInput): Promise<Medicine> => {
    const response = await axiosInstance.post<Medicine>(`/medicines/${id}/take`, log);
    return response.data;
  },
};

export async function createMedicine(data: CreateMedicineInput) {
  return medicineService.createMedicine(data);
}

export async function getAllMedicines(status?: 'active' | 'inactive', date?: string, patientId?: string) {
  return medicineService.getAllMedicines(status, date, patientId);
}

export async function getMedicineById(id: string) {
  return medicineService.getMedicineById(id);
}

export async function updateMedicine(id: string, data: UpdateMedicineInput) {
  return medicineService.updateMedicine(id, data);
}

export async function deleteMedicine(id: string) {
  return medicineService.deleteMedicine(id);
}

export async function logIntake(id: string, log: MedicineLogInput) {
  return medicineService.logIntake(id, log);
}
