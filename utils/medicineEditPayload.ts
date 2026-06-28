import { DURATIONS } from "../constants/medicine";
import type { EditMedicineFormEntry, EditScheduleFormState } from "./medicineFormMapping";

const isMongoObjectId = (value?: string): boolean =>
  Boolean(value && /^[a-f\d]{24}$/i.test(value));

const resolveDurationFields = (
  med: EditMedicineFormEntry,
  schedule: EditScheduleFormState
) => {
  const forHowLong = med.isDurationInherited
    ? schedule.duration
    : med.duration.durationLabel;
  const startDate = med.isDurationInherited
    ? schedule.startDate
    : med.duration.startDate;
  const durationValue = DURATIONS.find((item) => item.label === forHowLong)?.value;

  return {
    startDate: startDate.toISOString(),
    forHowLong,
    isOngoing: durationValue === -1 || forHowLong === "Ongoing",
  };
};

const normalizeMealTiming = (mealTiming: string[]): string => {
  if (!mealTiming.length) {
    return "Any Time";
  }

  return mealTiming[0];
};

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

export const buildUpdateMedicineGroupPayload = (
  schedule: EditScheduleFormState,
  medicines: EditMedicineFormEntry[],
  removedMedicineIds: string[],
  options?: { patientId?: string }
): UpdateMedicineGroupPayload => {
  const scheduleDurationValue = DURATIONS.find((item) => item.label === schedule.duration)?.value;

  return {
    name: schedule.name || undefined,
    duration: {
      startDate: schedule.startDate.toISOString(),
      forHowLong: schedule.duration,
      isOngoing: scheduleDurationValue === -1 || schedule.duration === "Ongoing",
    },
    groupNotes: schedule.groupNotes || undefined,
    prescribedBy: schedule.prescribedBy || undefined,
    pharmacyName: schedule.pharmacyName || undefined,
    reminderEnabled: schedule.reminderEnabled,
    medicines: medicines.map((med) => {
      const duration = resolveDurationFields(med, schedule);

      return {
        ...(med.isNew || !isMongoObjectId(med.id) ? {} : { _id: med.id }),
        name: med.name.trim(),
        dosage: {
          amount: med.dosage.amount,
          unit: med.dosage.unit || "mg",
          perIntake: Number(med.dosage.perIntake) || 1,
        },
        routines: med.customSchedule.enabled ? [] : med.routineIds,
        customSchedule: {
          enabled: med.customSchedule.enabled,
          times: med.customSchedule.enabled ? med.customSchedule.times : [],
          frequency: med.customSchedule.frequency || "Once daily",
        },
        mealTiming: normalizeMealTiming(med.mealTiming),
        duration,
        isDurationInherited: med.isDurationInherited,
        expiryDate: med.expiryDate ? med.expiryDate.toISOString() : undefined,
        isPharmacyInherited: med.isPharmacyInherited,
        pharmacyName: med.isPharmacyInherited ? undefined : med.pharmacyName || undefined,
        refill: {
          remainingQuantity: Number(med.refill.remainingQuantity) || 0,
          refillReminderEnabled: med.refill.refillReminderEnabled,
          refillAt: med.refill.refillAt || "0",
        },
        purpose: med.purpose || schedule.name || med.name,
        notes: med.notes || schedule.groupNotes || "",
        meta: {
          color: med.meta.color || "#4CAF50",
          photo: med.meta.photo || "",
          type: med.meta.type || "",
        },
        reminderEnabled: med.reminderEnabled ?? schedule.reminderEnabled,
      };
    }),
    removedMedicineIds: removedMedicineIds.filter(isMongoObjectId),
    patientId: options?.patientId,
  };
};

export const validateMedicineGroupEditForm = (
  schedule: EditScheduleFormState,
  medicines: EditMedicineFormEntry[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!schedule.scheduleGroupId) {
    errors.group = "Medicine group ID is missing";
  }

  medicines.forEach((med, index) => {
    if (!med.name.trim()) {
      errors[`name_${index}`] = "Medicine name is required";
    }

    if (!med.dosage.amount.trim()) {
      errors[`dosage_${index}`] = "Dosage is required";
    }

    if (!med.meta.type) {
      errors[`type_${index}`] = "Medicine type is required";
    }

    if (!med.isDurationInherited && !med.duration.durationLabel) {
      errors[`duration_${index}`] = "Duration is required";
    }

    if (med.customSchedule.enabled) {
      if (!med.customSchedule.frequency) {
        errors[`frequency_${index}`] = "Frequency is required";
      }
      if (!med.customSchedule.times.length) {
        errors[`frequency_${index}`] = "At least one schedule time is required";
      }
    } else if (!med.routineIds.length) {
      errors[`frequency_${index}`] = "Select at least one routine";
    }
  });

  return errors;
};
