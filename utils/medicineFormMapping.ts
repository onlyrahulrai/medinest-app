import { DURATIONS, FREQUENCIES } from "../constants/medicine";
import { resolveOwnerId } from "../constants/medicationTheme";
import type { MedicineGroupDetails, MedicineGroupMedicine } from "../services/api/medicineGroups";

export interface EditMedicineFormEntry {
  id?: string;
  name: string;
  dosage: {
    amount: string;
    unit: string;
    perIntake: string;
  };
  routineIds: string[];
  customSchedule: {
    enabled: boolean;
    frequency: string;
    times: string[];
  };
  mealTiming: string[];
  isDurationInherited: boolean;
  duration: {
    startDate: Date;
    durationLabel: string;
    isOngoing: boolean;
  };
  refill: {
    remainingQuantity: string;
    refillAt: string;
    refillReminderEnabled: boolean;
  };
  notes: string;
  meta: {
    color: string;
    photo: string;
    type: string;
  };
  reminderEnabled: boolean;
  purpose: string;
  expiryDate: Date | null;
  isPharmacyInherited: boolean;
  pharmacyName: string;
  isNew?: boolean;
}

export interface EditScheduleFormState {
  reminderEnabled: boolean;
  ownerId: string;
  startDate: Date;
  duration: string;
  name: string;
  prescribedBy: string;
  pharmacyName: string;
  groupNotes: string;
  scheduleGroupId?: string;
}

export interface EditMedicineGroupFormState {
  schedule: EditScheduleFormState;
  medicines: EditMedicineFormEntry[];
}

const DEFAULT_COLOR = "#4CAF50";

export const resolveDurationLabel = (duration?: {
  forHowLong?: string;
  isOngoing?: boolean;
  endDate?: string;
  startDate?: string;
}): string => {
  if (duration?.forHowLong?.trim()) {
    return duration.forHowLong.trim();
  }

  if (duration?.isOngoing) {
    return "Ongoing";
  }

  if (duration?.startDate && duration?.endDate) {
    const start = new Date(duration.startDate);
    const end = new Date(duration.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
    const match = DURATIONS.find((item) => item.value === days);
    if (match) {
      return match.label;
    }
  }

  return "30 days";
};

const inferFrequencyFromTimes = (times: string[] = []): string => {
  if (times.length >= 4) return "Four times daily";
  if (times.length === 3) return "Three times daily";
  if (times.length === 2) return "Twice daily";
  if (times.length === 0) return "As needed";
  return "Once daily";
};

export const normalizeFrequency = (frequency?: string, times: string[] = []): string => {
  if (!frequency) {
    return inferFrequencyFromTimes(times);
  }

  const value = frequency.trim();
  if (value === "as_needed") return "As needed";
  if (value === "daily") return inferFrequencyFromTimes(times);
  if (FREQUENCIES.some((item) => item.label === value)) {
    return value;
  }

  return inferFrequencyFromTimes(times);
};

const normalizeMealTiming = (mealTiming?: string | string[]): string[] => {
  if (Array.isArray(mealTiming)) {
    return mealTiming.filter(Boolean);
  }

  if (!mealTiming) {
    return [];
  }

  return mealTiming
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const extractRoutineIds = (medicine: any): string[] => {
  const source = medicine.routineIds ?? medicine.routines ?? [];
  return source
    .map((item: any) => {
      if (typeof item === "string") return item;
      if (item?._id) return String(item._id);
      return null;
    })
    .filter(Boolean) as string[];
};

const parseDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const mapMedicineToFormEntry = (medicine: any): EditMedicineFormEntry => {
  const durationLabel = resolveDurationLabel(medicine.duration);
  const customTimes = medicine.customSchedule?.times || ["09:00"];
  const customEnabled = Boolean(medicine.customSchedule?.enabled);
  const meta = medicine.meta || {};

  return {
    id: medicine._id ? String(medicine._id) : undefined,
    name: medicine.name || "",
    dosage: {
      amount: medicine.dosage?.amount != null ? String(medicine.dosage.amount) : "",
      unit: medicine.dosage?.unit || "mg",
      perIntake: medicine.dosage?.perIntake != null ? String(medicine.dosage.perIntake) : "1",
    },
    routineIds: extractRoutineIds(medicine),
    customSchedule: {
      enabled: customEnabled,
      frequency: normalizeFrequency(medicine.customSchedule?.frequency, customTimes),
      times: customTimes,
    },
    mealTiming: normalizeMealTiming(medicine.mealTiming),
    isDurationInherited: medicine.isDurationInherited ?? true,
    duration: {
      startDate: parseDate(medicine.duration?.startDate) || new Date(),
      durationLabel,
      isOngoing: durationLabel === "Ongoing" || Boolean(medicine.duration?.isOngoing),
    },
    refill: {
      remainingQuantity:
        medicine.refill?.remainingQuantity != null
          ? String(medicine.refill.remainingQuantity)
          : "",
      refillAt: medicine.refill?.refillAt != null ? String(medicine.refill.refillAt) : "",
      refillReminderEnabled: Boolean(
        medicine.refill?.refillReminderEnabled ?? medicine.refill?.refillReminder
      ),
    },
    notes: medicine.notes || "",
    meta: {
      color: meta.color || medicine.color || DEFAULT_COLOR,
      photo: meta.photo || medicine.imageUrl || "",
      type: meta.type || medicine.type || "",
    },
    reminderEnabled: medicine.reminderEnabled ?? true,
    purpose: medicine.purpose || medicine.prescription?.purpose || "",
    expiryDate: parseDate(medicine.expiryDate),
    isPharmacyInherited: medicine.isPharmacyInherited ?? true,
    pharmacyName: medicine.pharmacyName || "",
  };
};

export const mapMedicineGroupToEditForm = (
  group: MedicineGroupDetails,
  currentUserId?: string
): EditMedicineGroupFormState => {
  return {
    schedule: {
      reminderEnabled: group.reminderEnabled ?? true,
      ownerId: resolveOwnerId(group.user, currentUserId, group.createdBy),
      startDate: parseDate(group.duration?.startDate) || new Date(),
      duration: resolveDurationLabel(group.duration),
      name: group.name || "",
      prescribedBy: group.prescribedBy || "",
      pharmacyName: group.pharmacyName || "",
      groupNotes: group.notes || "",
      scheduleGroupId: group._id,
    },
    medicines: (group.medicines || []).map((medicine: MedicineGroupMedicine) =>
      mapMedicineToFormEntry(medicine)
    ),
  };
};

export const resolveGroupIdFromMedicine = (medicine: any): string | undefined => {
  const groupRef = medicine.group ?? medicine.scheduleGroupId;
  if (!groupRef) return undefined;
  return typeof groupRef === "object" ? String(groupRef._id) : String(groupRef);
};
