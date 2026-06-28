import axiosInstance from "./base";

export interface MedicineGroupDuration {
  startDate: string;
  endDate?: string;
  forHowLong?: string;
  isOngoing?: boolean;
}

export interface MedicineGroupSummary {
  _id: string;
  user: string;
  createdBy?: string;
  isSelfCreated?: boolean;
  name?: string;
  type: "single" | "multi";
  duration: MedicineGroupDuration;
  status: "active" | "completed" | "archived";
  notes?: string;
  prescribedBy?: string;
  pharmacyName?: string;
  reminderEnabled?: boolean;
  medicineCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineGroupMedicine {
  _id: string;
  user: string;
  name: string;
  dosage: {
    amount: string | number;
    unit: string;
    perIntake?: number;
  };
  routineIds?: string[];
  customSchedule?: {
    enabled: boolean;
    times: string[];
    frequency?: string;
  };
  mealTiming?: string | string[];
  duration?: {
    startDate?: string;
    forHowLong?: string;
    isOngoing?: boolean;
    endDate?: string;
  };
  isDurationInherited?: boolean;
  purpose?: string;
  notes?: string;
  expiryDate?: string;
  pharmacyName?: string;
  isPharmacyInherited?: boolean;
  refill?: {
    remainingQuantity?: number;
    refillAt?: number | string;
    refillReminderEnabled?: boolean;
  };
  meta?: {
    color?: string;
    photo?: string;
    type?: string;
  };
  reminderEnabled?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineGroupDetails extends Omit<MedicineGroupSummary, "medicineCount"> {
  medicines: MedicineGroupMedicine[];
}

export interface MedicineGroupListResponse {
  total: number;
  results: MedicineGroupSummary[];
}

export interface UpdateMedicineGroupPayload {
  name?: string;
  duration: {
    startDate: string;
    forHowLong: string;
    isOngoing: boolean;
  };
  groupNotes?: string;
  prescribedBy?: string;
  pharmacyName?: string;
  reminderEnabled: boolean;
  medicines: Array<{
    _id?: string;
    name: string;
    dosage: {
      amount: string;
      unit: string;
      perIntake: number;
    };
    routines: string[];
    customSchedule: {
      enabled: boolean;
      times: string[];
      frequency: string;
    };
    mealTiming: string;
    duration: {
      startDate: string;
      forHowLong: string;
      isOngoing: boolean;
    };
    isDurationInherited: boolean;
    expiryDate?: string;
    isPharmacyInherited: boolean;
    pharmacyName?: string;
    refill: {
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
  }>;
  removedMedicineIds: string[];
  patientId?: string;
}

export const medicineGroupService = {
  getAll: async (
    status?: "active" | "completed" | "archived",
    patientId?: string
  ): Promise<MedicineGroupListResponse> => {
    const response = await axiosInstance.get<MedicineGroupListResponse>("/medicine-groups", {
      params: { status, patientId },
    });
    return response.data;
  },

  getById: async (id: string, patientId?: string): Promise<MedicineGroupDetails> => {
    const response = await axiosInstance.get<MedicineGroupDetails>(`/medicine-groups/${id}`, {
      params: { patientId },
    });
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateMedicineGroupPayload
  ): Promise<MedicineGroupDetails> => {
    const response = await axiosInstance.put<MedicineGroupDetails>(`/medicine-groups/${id}`, data);
    return response.data;
  },
};

export async function getAllMedicineGroups(
  status?: "active" | "completed" | "archived",
  patientId?: string
) {
  return medicineGroupService.getAll(status, patientId);
}

export async function getMedicineGroupById(id: string, patientId?: string) {
  return medicineGroupService.getById(id, patientId);
}

export async function updateMedicineGroup(id: string, data: UpdateMedicineGroupPayload) {
  return medicineGroupService.update(id, data);
}
