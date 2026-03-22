import AsyncStorage from "@react-native-async-storage/async-storage";

const MEDICATIONS_KEY = "@medications";
const DOSE_HISTORY_KEY = "@dose_history";
const USER_PROFILE_KEY = "@user_profile";
 
export interface WorkoutPlan {
  goal: 'weight_loss' | 'muscle_gain' | 'fitness' | 'strength' | 'none';
  frequency: string;
  intensity: 'light' | 'moderate' | 'high';
  lastUpdated: string;
}

export interface ManagedPatient {
  id: string;
  name: string;
  image?: string;
  phoneNumber?: string;
  nextMedication?: string;
}

export interface UserProfile {
  id?: string; // Unique ID for the user
  name: string;
  dateOfBirth: string; // ISO date string
  gender: string;
  weight: string;
  image?: string; // Profile image URI
  conditions: string[];
  phoneNumber: string;
  caregivers: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    relation: string;
  }>;
  managedPatients: ManagedPatient[]; // People this user cares for
  reminderTimes: string[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  shareActivityWithCaregiver: boolean;
  isOnboardingCompleted: boolean;
  onboardingStep?: number;
  workoutPlan?: WorkoutPlan;
}

export interface Medication {
  id: string;
  ownerId?: string; // userId of the patient (defaults to 'self')
  scheduleGroupId?: string; // Groups multiple medicines under one schedule
  name: string;
  dosage: string;
  dosageUnit?: string; // mg, ml, mcg, IU, drops, puffs
  type?: string; // Tablet, Capsule, Liquid, Injection, etc.
  mealTiming?: string[]; // Before Meal, After Meal, With Meal, etc.
  prescribedBy?: string; // Doctor name
  purpose?: string; // Condition it treats
  frequency?: string; // e.g., 'Once daily'
  times: string[];
  startDate: string;
  duration: string;
  color: string;
  reminderEnabled: boolean;
  currentSupply: number;
  totalSupply: number;
  refillAt: number;
  refillReminder: boolean;
  lastRefillDate?: string;
  imageUrl?: string;
  addedBy?: 'patient' | 'caregiver';
  notes?: string;
}

export interface DoseHistory {
  id: string;
  medicationId: string;
  patientId?: string; // userId of the patient
  timestamp: string;
  taken: boolean;
  status: 'taken' | 'missed' | 'skipped';
}

export async function getMedications(): Promise<Medication[]> {
  try {
    const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting medications:", error);
    return [];
  }
}

export async function getMedicationsForUser(userId: string = 'self'): Promise<Medication[]> {
    const allMedications = await getMedications();
    return allMedications.filter(med => (med.ownerId || 'self') === userId);
}

export async function addMedication(medication: Medication): Promise<void> {
  try {
    const medications = await getMedications();
    if (!medication.ownerId) medication.ownerId = 'self';
    medications.push(medication);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error adding medication:", error);
    throw error;
  }
}

export async function addMedicationGroup(medicationGroup: Medication[]): Promise<void> {
  try {
    const medications = await getMedications();
    const groupId = Math.random().toString(36).substr(2, 9);
    for (const med of medicationGroup) {
      if (!med.ownerId) med.ownerId = 'self';
      med.scheduleGroupId = groupId;
      medications.push(med);
    }
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
  } catch (error) {
    console.error("Error adding medication group:", error);
    throw error;
  }
}

export async function getMedicationsByGroupId(groupId: string): Promise<Medication[]> {
  const allMedications = await getMedications();
  return allMedications.filter(med => med.scheduleGroupId === groupId);
}

export async function updateMedication(
  updatedMedication: Medication
): Promise<void> {
  try {
    const medications = await getMedications();
    const index = medications.findIndex(
      (med) => med.id === updatedMedication.id
    );
    if (index !== -1) {
      medications[index] = updatedMedication;
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));
    }
  } catch (error) {
    console.error("Error updating medication:", error);
    throw error;
  }
}

export async function deleteMedication(id: string): Promise<void> {
  try {
    const medications = await getMedications();
    const updatedMedications = medications.filter((med) => med.id !== id);
    await AsyncStorage.setItem(
      MEDICATIONS_KEY,
      JSON.stringify(updatedMedications)
    );
  } catch (error) {
    console.error("Error deleting medication:", error);
    throw error;
  }
}

export async function getDoseHistory(): Promise<DoseHistory[]> {
  try {
    const data = await AsyncStorage.getItem(DOSE_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting dose history:", error);
    return [];
  }
}

export async function getTodaysDoses(): Promise<DoseHistory[]> {
  try {
    const history = await getDoseHistory();
    const today = new Date().toDateString();
    return history.filter(
      (dose) => new Date(dose.timestamp).toDateString() === today
    );
  } catch (error) {
    console.error("Error getting today's doses:", error);
    return [];
  }
}

export async function recordDose(
  medicationId: string,
  taken: boolean,
  timestamp: string,
  patientId: string = 'self',
  status: 'taken' | 'missed' | 'skipped' = 'taken'
): Promise<void> {
  try {
    const history = await getDoseHistory();
    const newDose: DoseHistory = {
      id: Math.random().toString(36).substr(2, 9),
      medicationId,
      patientId,
      timestamp,
      taken,
      status
    };

    history.push(newDose);
    await AsyncStorage.setItem(DOSE_HISTORY_KEY, JSON.stringify(history));

    // Cancel missed alert if taken
    if (taken || status === 'skipped') {
        const { cancelMissedDoseAlert } = require('./notifications');
        cancelMissedDoseAlert(medicationId).catch(console.error);
    }

    // Update medication supply if taken
    if (taken) {
      const medications = await getMedications();
      const medication = medications.find((med) => med.id === medicationId);
      if (medication && medication.currentSupply > 0) {
        medication.currentSupply -= 1;
        await updateMedication(medication);
      }
    }
  } catch (error) {
    console.error("Error recording dose:", error);
    throw error;
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([MEDICATIONS_KEY, DOSE_HISTORY_KEY, USER_PROFILE_KEY]);
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (data) {
      const parsed: any = JSON.parse(data);
      if (!parsed.managedPatients) parsed.managedPatients = [];
      
      // Backwards compatibility migration
      if (parsed.emergencyContact !== undefined) {
        if (parsed.emergencyContact) {
          parsed.caregivers = [{
            id: Math.random().toString(36).substr(2, 9),
            ...parsed.emergencyContact
          }];
        } else {
          parsed.caregivers = [];
        }
        delete parsed.emergencyContact;
        await saveUserProfile(parsed); // Save the migrated profile
      }
      return parsed as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function addManagedPatient(patient: ManagedPatient): Promise<void> {
    const profile = await getUserProfile();
    if (profile) {
        if (!profile.managedPatients) profile.managedPatients = [];
        profile.managedPatients.push(patient);
        await saveUserProfile(profile);
    }
}

export async function removeManagedPatient(patientId: string): Promise<void> {
    const profile = await getUserProfile();
    if (profile && profile.managedPatients) {
        profile.managedPatients = profile.managedPatients.filter(p => p.id !== patientId);
        await saveUserProfile(profile);
    }
}

export async function removeCaregiver(caregiverId: string): Promise<void> {
    const profile = await getUserProfile();
    if (profile && profile.caregivers) {
        profile.caregivers = profile.caregivers.filter(c => c.id !== caregiverId);
        await saveUserProfile(profile);
    }
}

export async function checkMissedDoses(): Promise<void> {
    const medications = await getMedications();
    const history = await getDoseHistory();
    const now = new Date();
    const today = now.toDateString();
    
    for (const med of medications) {
        for (const time of med.times) {
            const [h, m] = time.split(':').map(Number);
            const scheduledTime = new Date();
            scheduledTime.setHours(h, m, 0, 0);
            
            // Missed window: 2 hours after scheduled time
            const missedDeadline = new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000);
            
            if (now > missedDeadline) {
                // Check if already recorded for today
                const alreadyRecorded = history.some(h => 
                    h.medicationId === med.id && 
                    new Date(h.timestamp).toDateString() === today &&
                    (h.status === 'taken' || h.status === 'missed' || h.status === 'skipped')
                );
                
                if (!alreadyRecorded) {
                    await recordDose(med.id, false, scheduledTime.toISOString(), med.ownerId || 'self', 'missed');
                }
            }
        }
    }
}

export async function getMissedDosesForCaregiver(): Promise<Array<{ medName: string; patientName: string; time: string }>> {
    const profile = await getUserProfile();
    if (!profile || !profile.managedPatients) return [];
    
    const history = await getDoseHistory();
    const medications = await getMedications();
    const today = new Date().toDateString();
    
    const alerts: Array<{ medName: string; patientName: string; time: string }> = [];
    
    profile.managedPatients.forEach(patient => {
        const missed = history.filter(h => 
            h.patientId === patient.id && 
            h.status === 'missed' && 
            new Date(h.timestamp).toDateString() === today
        );
        
        missed.forEach(m => {
            const med = medications.find(med => med.id === m.medicationId);
            if (med) {
                alerts.push({
                    medName: med.name,
                    patientName: patient.name,
                    time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            }
        });
    });
    
    return alerts;
}

