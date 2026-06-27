import { MEDICINE_COLORS } from "./medicine";

export interface SampleMedicineEntry {
  _id: string;
  name: string;
  dosage: { amount: string; unit: string; perIntake: string };
  routineIds: string[];
  customSchedule: { enabled: boolean; times: string[]; frequency: string };
  mealTiming: string[];
  duration: { startDate: Date; forHowLong: string; isOngoing: boolean };
  isDurationInherited: boolean;
  refill: { remainingQuantity: string; refillAt: string; refillReminderEnabled: boolean };
  purpose: string;
  notes: string;
  expiryDate: Date | null;
  isPharmacyInherited: boolean;
  pharmacyName: string;
  meta: { color: string; photo: string; type: string };
  reminderEnabled: boolean;
}

export interface SampleMedicationFormData {
  schedule: {
    reminderEnabled: boolean;
    duration: { startDate: Date; forHowLong: string; isOngoing: boolean };
    name: string;
    prescribedBy: string;
    pharmacyName: string;
    groupNotes: string;
  };
  medicines: SampleMedicineEntry[];
}

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

export const getSampleMedicationFormData = (
  routineIds: string[] = []
): SampleMedicationFormData => {
  const startDate = new Date();
  const useRoutines = routineIds.length > 0;

  return {
    schedule: {
      reminderEnabled: true,
      duration: {
        startDate,
        forHowLong: "30 days",
        isOngoing: false,
      },
      name: "Fever & Cold Recovery",
      prescribedBy: "Dr. Priya Sharma",
      pharmacyName: "Apollo Pharmacy, MG Road",
      groupNotes: "Complete the full course. Drink plenty of water and rest well.",
    },
    medicines: [
      {
        _id: "sample-paracetamol",
        name: "Paracetamol",
        dosage: { amount: "500", unit: "mg", perIntake: "1" },
        routineIds: useRoutines ? routineIds.slice(0, 1) : [],
        customSchedule: {
          enabled: !useRoutines,
          frequency: "Twice daily",
          times: ["09:00", "21:00"],
        },
        mealTiming: ["After Meal"],
        duration: { startDate, forHowLong: "30 days", isOngoing: false },
        isDurationInherited: true,
        refill: {
          remainingQuantity: "20",
          refillAt: "5",
          refillReminderEnabled: true,
        },
        purpose: "Fever and body pain",
        notes: "Take after food. Do not exceed 4 doses in 24 hours.",
        expiryDate: addMonths(startDate, 6),
        isPharmacyInherited: true,
        pharmacyName: "",
        meta: { color: MEDICINE_COLORS[0], photo: "", type: "Tablet" },
        reminderEnabled: true,
      },
      {
        _id: "sample-amoxicillin",
        name: "Amoxicillin",
        dosage: { amount: "250", unit: "mg", perIntake: "1" },
        routineIds: useRoutines ? routineIds.slice(0, 2) : [],
        customSchedule: {
          enabled: !useRoutines,
          frequency: "Three times daily",
          times: ["09:00", "15:00", "21:00"],
        },
        mealTiming: ["With Meal"],
        duration: { startDate, forHowLong: "7 days", isOngoing: false },
        isDurationInherited: false,
        refill: {
          remainingQuantity: "21",
          refillAt: "3",
          refillReminderEnabled: false,
        },
        purpose: "Bacterial infection",
        notes: "Finish all capsules even if you feel better.",
        expiryDate: addMonths(startDate, 3),
        isPharmacyInherited: false,
        pharmacyName: "MedPlus Pharmacy, Sector 12",
        meta: { color: MEDICINE_COLORS[1], photo: "", type: "Capsule" },
        reminderEnabled: true,
      },
    ],
  };
};
