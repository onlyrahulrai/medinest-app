import axiosInstance from './base';

export interface MedicineDosage {
  amount: string;
  unit: string;
  perIntake: number;
}

export interface CustomSchedule {
  enabled: boolean;
  times: string[];
  frequency: 'daily' | 'weekly' | 'custom' | 'as_needed';
  daysOfWeek?: number[];
}

export interface MedicineDuration {
  startDate: string;
  endDate?: string;
}

export interface MedicinePrescription {
  prescribedBy?: string;
  purpose?: string;
}

export interface MedicineRefill {
  refillReminder: boolean;
  totalQuantity: number;
  remainingQuantity: number;
  refillAt: number;
}

export interface Medicine {
  _id: string;
  userId: string;
  name: string;
  type: string;
  dosage: MedicineDosage;
  routineIds: any[]; // Populated
  customSchedule: CustomSchedule;
  duration: MedicineDuration;
  mealTiming: string[];
  prescription: MedicinePrescription;
  notes?: string;
  instructions?: string;
  color?: string;
  imageUrl?: string;
  refill: MedicineRefill;
  reminderEnabled: boolean;
  scheduleGroupId?: string;
  scheduleGroupName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicineInput { // Keeping for backward compatibility if any
  name: string;
  type: string;
  dosage: MedicineDosage;
  routineIds?: string[];
  customSchedule: CustomSchedule;
  duration: MedicineDuration;
  mealTiming?: string[];
  prescription: MedicinePrescription;
  notes?: string;
  instructions?: string;
  color?: string;
  imageUrl?: string;
  refill: MedicineRefill;
  reminderEnabled?: boolean;
  scheduleGroupId?: string;
  scheduleGroupName?: string;
  patientId?: string;
}

export interface CreateMedicineScheduleInput {
  user: string;
  name: string;
  startDate: string;
  groupForHowLong: string;
  groupNotes: string;
  prescribedBy: string;
  reminderEnabled: boolean;
  medicines: {
    name: string;
    dosage: {
      amount: string;
      unit: string;
      perIntake: number;
    };
    routineIds: string[];
    customSchedule: {
      enabled: boolean;
      times: string[];
      frequency: string;
    };
    mealTiming: string;
    duration: {
      startDate: string;
      durationInDays: string;
      isOngoing: boolean;
    };
    isDurationInherited: boolean;
    refill: {
      totalQuantity: number;
      remainingQuantity: number;
      refillReminderEnabled: boolean;
      refillAt: string;
    };
    purpose: string;
    notes: string;
    meta: {
      color: string;
      photo: string;
      type: string;
    };
    reminderEnabled: boolean;
  }[];
}

export interface UpdateMedicineInput extends Partial<CreateMedicineInput> {
  isActive?: boolean;
}

export const medicineService = {
  createMedicine: async (data: CreateMedicineScheduleInput | CreateMedicineInput): Promise<any> => {
    const response = await axiosInstance.post<any>('/medicines', data);
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
};

export async function createMedicine(data: CreateMedicineScheduleInput | CreateMedicineInput) {
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
