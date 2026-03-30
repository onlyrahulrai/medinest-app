import { useState } from "react";
import moment from "moment";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import ManageRoutinesBottomSheet from "../../components/medications/ManageRoutinesBottomSheet";
import {
  getUserProfile,
  ManagedPatient,
  UserProfile
} from "../../utils/storage";
import { useEffect } from "react";
import {
  scheduleMedicationReminder,
  scheduleRefillReminder,
} from "../../utils/notifications";
import { createMedicine, type CreateMedicineInput } from "../../services/api/medicines";
import RoutineService, { type Routine } from "../../services/api/routine";

// Top-level width calculation moved into the component for better reliability with Expo Go/Bridgeless mode.

const MEDICATION_TYPES = [
  { id: "tablet", label: "Tablet", icon: "tablet-portrait-outline" as const },
  { id: "capsule", label: "Capsule", icon: "ellipse-outline" as const },
  { id: "liquid", label: "Liquid", icon: "water-outline" as const },
  { id: "injection", label: "Injection", icon: "fitness-outline" as const },
  { id: "drops", label: "Drops", icon: "eyedrop-outline" as const },
  { id: "inhaler", label: "Inhaler", icon: "cloud-outline" as const },
  { id: "cream", label: "Cream", icon: "bandage-outline" as const },
  { id: "patch", label: "Patch", icon: "square-outline" as const },
];

const MEAL_TIMINGS = [
  { id: "before", label: "Before Meal", icon: "time-outline" as const },
  { id: "after", label: "After Meal", icon: "restaurant-outline" as const },
  { id: "with", label: "With Meal", icon: "fast-food-outline" as const },
  { id: "empty", label: "Empty Stomach", icon: "moon-outline" as const },
  { id: "any", label: "Any Time", icon: "sunny-outline" as const },
];

const DOSAGE_UNITS = ["mg", "ml", "mcg", "IU", "drops", "puffs", "units"];

const MEDICINE_COLORS = [
  "#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0",
  "#00BCD4", "#FF5722", "#607D8B", "#795548", "#F44336",
];

const FREQUENCIES = [
  { id: "1", label: "Once daily", icon: "sunny-outline" as const, times: ["09:00"] },
  { id: "2", label: "Twice daily", icon: "sync-outline" as const, times: ["09:00", "21:00"] },
  { id: "3", label: "Three times daily", icon: "time-outline" as const, times: ["09:00", "15:00", "21:00"] },
  { id: "4", label: "Four times daily", icon: "repeat-outline" as const, times: ["09:00", "13:00", "17:00", "21:00"] },
  { id: "5", label: "As needed", icon: "calendar-outline" as const, times: [] },
];

const DURATIONS = [
  { id: "1", label: "7 days", value: 7 },
  { id: "2", label: "14 days", value: 14 },
  { id: "3", label: "30 days", value: 30 },
  { id: "4", label: "90 days", value: 90 },
  { id: "5", label: "Ongoing", value: -1 },
];

interface MedicineEntry {
  name: string;
  dosage: string;
  dosageUnit: string;
  type: string;
  mealTiming: string[];
  prescribedBy: string;
  purpose: string;
  color: string;
  notes: string;
  refillReminder: boolean;
  currentSupply: string;
  refillAt: string;
  imageUri: string;
  perIntake: string;
  // Per-medicine schedule override
  customSchedule: boolean;
  useGroupDuration: boolean;
  routineIds: string[];
  frequency: string;
  times: string[];
  duration: string;
  startDate: Date;
}

const createEmptyMedicine = (): MedicineEntry => ({
  name: "",
  dosage: "",
  dosageUnit: "mg",
  type: "",
  mealTiming: [],
  prescribedBy: "",
  purpose: "",
  color: "#4CAF50",
  notes: "",
  refillReminder: false,
  currentSupply: "",
  refillAt: "",
  imageUri: "",
  perIntake: "1",
  customSchedule: false,
  useGroupDuration: true,
  routineIds: [],
  frequency: "Once daily",
  times: ["09:00"],
  duration: "30 days",
  startDate: new Date(),
});

export default function AddMedicationScreen() {
  const { width } = Dimensions.get("window");
  const router = useRouter();

  // Common group-level fields (including global schedule)
  const [schedule, setSchedule] = useState({
    reminderEnabled: true,
    ownerId: "self",
    startDate: new Date(),
    duration: "30 days",
    name: "",
  });

  const [routines, setRoutines] = useState<Routine[]>([]);

  // Per-medicine fields
  const [medicines, setMedicines] = useState<MedicineEntry[]>([createEmptyMedicine()]);
  const [expandedMedicine, setExpandedMedicine] = useState(0);

  // Picker management
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [activeTimeIndex, setActiveTimeIndex] = useState<number>(0);

  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [managedPatients, setManagedPatients] = useState<ManagedPatient[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const THEMES = {
    self: {
      primary: "#065F46", secondary: "#064E3B", accent: "#059669",
      lightAccent: "#D1FAE5", headerColors: ["#065F46", "#064E3B"] as const,
      icon: "heart" as const, label: "Personal Health Profile"
    },
    other: {
      primary: "#1E40AF", secondary: "#1E3A8A", accent: "#2563EB",
      lightAccent: "#DBEAFE", headerColors: ["#1E40AF", "#1E3A8A"] as const,
      icon: "people-outline" as const, label: "Managed Patient"
    }
  };

  const theme = schedule.ownerId === "self" ? THEMES.self : THEMES.other;

  const getPatientName = () => {
    if (schedule.ownerId === "self") return userProfile?.name || "Me";
    const patient = managedPatients.find(p => p.id === schedule.ownerId);
    return patient ? patient.name : "Patient";
  };

  const getPatientAvatar = () => {
    if (schedule.ownerId === "self") return userProfile?.image;
    const patient = managedPatients.find(p => p.id === schedule.ownerId);
    return patient?.image;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const [profile, fetchedRoutines] = await Promise.all([
        getUserProfile(),
        RoutineService.getRoutines().catch(() => [])
      ]);
      setUserProfile(profile as any);
      setManagedPatients(profile?.managedPatients || []);
      setRoutines(fetchedRoutines);
      if (patientId) {
        setSchedule(prev => ({ ...prev, ownerId: patientId }));
      }
    };
    loadInitialData();
  }, [patientId]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageRoutines, setShowManageRoutines] = useState(false);

  const updateMedicine = (index: number, updates: Partial<MedicineEntry>) => {
    setMedicines(prev => prev.map((med, i) => i === index ? { ...med, ...updates } : med));
  };

  const addAnotherMedicine = () => {
    setMedicines(prev => [...prev, createEmptyMedicine()]);
    setExpandedMedicine(medicines.length);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length <= 1) return;
    setMedicines(prev => prev.filter((_, i) => i !== index));
    if (expandedMedicine >= medicines.length - 1) {
      setExpandedMedicine(Math.max(0, medicines.length - 2));
    }
  };

  const pickImage = async (medIndex: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateMedicine(medIndex, { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    let firstErrorIndex = -1;

    // Validate each medicine
    medicines.forEach((med, index) => {
      let medHasError = false;
      if (!med.name.trim()) {
        newErrors[`name_${index}`] = "Medication name is required";
        medHasError = true;
      }
      if (!med.dosage.trim()) {
        newErrors[`dosage_${index}`] = "Dosage is required";
        medHasError = true;
      }
      if (!med.type) {
        newErrors[`type_${index}`] = "Selection required";
        medHasError = true;
      }
      // Validate per-medicine schedule
      if (!med.useGroupDuration && !med.duration) {
        newErrors[`duration_${index}`] = "Duration is required";
        medHasError = true;
      }
      if (med.customSchedule) {
        if (!med.frequency) {
          newErrors[`frequency_${index}`] = "Frequency is required";
          medHasError = true;
        }
      }
      if (med.refillReminder) {
        if (!med.currentSupply) {
          newErrors[`currentSupply_${index}`] = "Required";
          medHasError = true;
        }
        if (!med.refillAt) {
          newErrors[`refillAt_${index}`] = "Required";
          medHasError = true;
        }
        if (med.currentSupply && med.refillAt && Number(med.refillAt) >= Number(med.currentSupply)) {
          newErrors[`refillAt_${index}`] = "Alert must be less than supply";
          medHasError = true;
        }
      }

      if (medHasError && firstErrorIndex === -1) {
        firstErrorIndex = index;
      }
    });

    setErrors(newErrors);
    if (firstErrorIndex !== -1) {
      setExpandedMedicine(firstErrorIndex);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        Alert.alert("Error", "Please fill in all required fields. Missing fields are highlighted in red.");
        return;
      }
      if (isSubmitting) return;
      setIsSubmitting(true);

      const groupId = medicines.length > 1 ? Math.random().toString(36).substr(2, 9) : undefined;

      for (const med of medicines) {
        const useCustom = med.customSchedule;

        // Map frequency
        let frequency: 'daily' | 'weekly' | 'custom' | 'as_needed' = 'daily';
        if (med.frequency.includes("Weekly")) frequency = 'weekly';
        if (med.frequency === "As needed") frequency = 'as_needed';
        if (med.frequency === "Custom") frequency = 'custom';

        // Calculate end date based on duration label
        const actualDurationStr = med.useGroupDuration ? schedule.duration : med.duration;
        const actualStartDate = med.useGroupDuration ? schedule.startDate : med.startDate;

        let endDate: string | undefined = undefined;
        const durationValue = DURATIONS.find(d => d.label === actualDurationStr)?.value;
        if (durationValue && durationValue > 0) {
          const end = new Date(actualStartDate);
          end.setDate(end.getDate() + durationValue);
          endDate = end.toISOString();
        }

        const payload: CreateMedicineInput = {
          name: med.name,
          type: med.type,
          dosage: {
            amount: med.dosage,
            unit: med.dosageUnit,
            perIntake: Number(med.perIntake) || 1
          },
          routineIds: useCustom ? [] : med.routineIds,
          customSchedule: {
            enabled: useCustom,
            times: useCustom ? med.times : [],
            frequency: frequency,
          },
          duration: {
            startDate: actualStartDate.toISOString(),
            endDate,
          },
          mealTiming: med.mealTiming,
          prescription: {
            prescribedBy: med.prescribedBy,
            purpose: med.purpose || schedule.name,
          },
          notes: med.notes,
          imageUrl: med.imageUri || undefined,
          color: med.color,
          refill: {
            refillReminder: med.refillReminder,
            remainingQuantity: Number(med.currentSupply) || 0,
            totalQuantity: Number(med.currentSupply) || 0,
            refillAt: Number(med.refillAt) || 0,
          },
          reminderEnabled: schedule.reminderEnabled,
          scheduleGroupId: groupId,
          scheduleGroupName: schedule.name,
          patientId: schedule.ownerId === "self" ? undefined : schedule.ownerId,
        };

        const savedMedicine = await createMedicine(payload);

        // Schedule local reminders for the newly created medicine
        if (payload.reminderEnabled) {
          await scheduleMedicationReminder({
            ...payload,
            id: savedMedicine._id, // Use backend ID
            ownerId: schedule.ownerId,
            startDate: payload.duration.startDate,
            frequency: med.frequency,
            times: useCustom ? payload.customSchedule.times : routines.filter(r => payload.routineIds?.includes(r._id)).map(r => r.time),
            duration: actualDurationStr,
          } as any);
        }

        if (payload.refill.refillReminder) {
          await scheduleRefillReminder({
            ...payload,
            id: savedMedicine._id,
          } as any);
        }
      }

      // Also sync to local storage for offline support/caching if needed
      // (Optional, but let's stick to API first as requested)

      Alert.alert(
        "Success",
        medicines.length > 1
          ? `${medicines.length} medications added successfully`
          : "Medication added successfully",
        [{ text: "OK", onPress: () => router.back() }],
        { cancelable: false }
      );
    } catch (error: any) {
      console.error("Save error details:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || error.message || "Failed to save medication. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFrequencyOptions = (medIndex: number) => {
    const freq = medicines[medIndex].frequency;
    const setFreq = (label: string, times: string[]) => {
      updateMedicine(medIndex, { frequency: label, times });
    };
    return (
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.optionCard, { width: (width - 88) / 2 }, freq === f.label && styles.selectedOptionCard]}
            onPress={() => setFreq(f.label, f.times)}
          >
            <View style={[styles.optionIcon, freq === f.label && styles.selectedOptionIcon]}>
              <Ionicons name={f.icon} size={24} color={freq === f.label ? "white" : "#666"} />
            </View>
            <Text style={[styles.optionLabel, freq === f.label && styles.selectedOptionLabel]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDurationOptions = (medIndex: number) => {
    const dur = medicines[medIndex].duration;
    const setDur = (label: string) => {
      updateMedicine(medIndex, { duration: label });
    };
    return (
      <View style={styles.optionsGrid}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.optionCard, { width: (width - 88) / 2 }, dur === d.label && styles.selectedOptionCard]}
            onPress={() => setDur(d.label)}
          >
            <Text style={[styles.durationNumber, dur === d.label && styles.selectedDurationNumber]}>
              {d.value > 0 ? d.value : "∞"}
            </Text>
            <Text style={[styles.optionLabel, dur === d.label && styles.selectedOptionLabel]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMedicineCard = (med: MedicineEntry, index: number) => {
    const isExpanded = expandedMedicine === index;
    const hasError = !!(errors[`name_${index}`] || errors[`dosage_${index}`] || errors[`type_${index}`] || errors[`duration_${index}`] || errors[`frequency_${index}`]);

    return (
      <View key={index} style={[styles.medicineCard, hasError && { borderColor: "#FF5252", borderWidth: 2 }]}>
        {/* Medicine Card Header */}
        <TouchableOpacity
          style={styles.medicineCardHeader}
          onPress={() => setExpandedMedicine(isExpanded ? -1 : index)}
        >
          <View style={[styles.medicineNumberBadge, { backgroundColor: med.color || theme.accent }]}>
            <Text style={styles.medicineNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.medicineHeaderInfo}>
            <Text style={styles.medicineHeaderTitle}>
              {med.name || `Medicine ${index + 1}`}
            </Text>
            {med.dosage ? (
              <Text style={styles.medicineHeaderSubtitle}>{med.dosage} {med.dosageUnit}</Text>
            ) : null}
          </View>
          <View style={styles.medicineHeaderActions}>
            {medicines.length > 1 && (
              <TouchableOpacity onPress={() => removeMedicine(index)} style={styles.removeMedBtn}>
                <Ionicons name="trash-outline" size={18} color="#E91E63" />
              </TouchableOpacity>
            )}
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#666" />
          </View>
        </TouchableOpacity>

        {/* Expanded Medicine Fields */}
        {isExpanded && (
          <View style={styles.medicineCardBody}>
            {/* 0. Medicine Picture */}
            <View style={[styles.innerSection, { borderBottomWidth: 0 }]}>
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity style={styles.imageContainerSmall} onPress={() => pickImage(index)}>
                  {med.imageUri ? (
                    <Image source={{ uri: med.imageUri }} style={styles.medicationImage} />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera-outline" size={28} color={theme.accent} />
                      <Text style={styles.imagePlaceholderText}>Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 1. Medication Name */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>1. Medication Name</Text>
              <View style={[styles.inputContainer, !!errors[`name_${index}`] && styles.inputError]}>
                <TextInput
                  style={styles.mainInput}
                  placeholder="e.g. Paracetamol"
                  placeholderTextColor="#999"
                  value={med.name}
                  onChangeText={(text) => {
                    updateMedicine(index, { name: text });
                    if (errors[`name_${index}`]) setErrors(prev => {
                      const newErrs = { ...prev };
                      delete newErrs[`name_${index}`];
                      return newErrs;
                    });
                  }}
                />
              </View>
            </View>

            {/* 2. Dosage & 3. Unit */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>2. Dosage & 3. Unit</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.mainInput, !!errors[`dosage_${index}`] && styles.inputError]}
                  placeholder="Dosage (e.g. 500)"
                  placeholderTextColor="#999"
                  value={med.dosage}
                  onChangeText={(text) => {
                    updateMedicine(index, { dosage: text });
                    if (errors[`dosage_${index}`]) setErrors(prev => {
                      const newErrs = { ...prev };
                      delete newErrs[`dosage_${index}`];
                      return newErrs;
                    });
                  }}
                  keyboardType="numeric"
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroller}>
                {DOSAGE_UNITS.map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[styles.unitChip, med.dosageUnit === unit && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => updateMedicine(index, { dosageUnit: unit })}
                  >
                    <Text style={[styles.unitChipText, med.dosageUnit === unit && { color: "white" }]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.subSectionLabel, { marginTop: 12 }]}>Amount per intake</Text>
              <View style={[styles.inputContainer, { width: 100 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  value={med.perIntake}
                  onChangeText={(text) => updateMedicine(index, { perIntake: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* 4. Schedule Configuration */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>4. Schedule Configuration</Text>

              {/* Schedule Type Selector */}
              <View style={styles.scheduleTypeContainer}>
                <TouchableOpacity
                  style={[styles.scheduleTypeBtn, !med.customSchedule && { backgroundColor: theme.accent }]}
                  onPress={() => updateMedicine(index, { customSchedule: false })}
                >
                  <Text style={[styles.scheduleTypeBtnText, !med.customSchedule && { color: 'white' }]}>Routines</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.scheduleTypeBtn, med.customSchedule && { backgroundColor: theme.accent }]}
                  onPress={() => updateMedicine(index, { customSchedule: true })}
                >
                  <Text style={[styles.scheduleTypeBtnText, med.customSchedule && { color: 'white' }]}>Custom</Text>
                </TouchableOpacity>
              </View>

              {!med.customSchedule ? (
                <View style={{ marginTop: 15 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={styles.subSectionLabel}>Select Routines</Text>
                    <TouchableOpacity onPress={() => setShowManageRoutines(true)}>
                      <Text style={{ fontSize: 13, color: theme.accent, fontWeight: '600' }}>Manage Routines</Text>
                    </TouchableOpacity>
                  </View>

                  {routines.length > 0 ? (
                    <View style={styles.routinesGrid}>
                      {routines.map((r) => {
                        const isSelected = med.routineIds.includes(r._id);
                        return (
                          <TouchableOpacity
                            key={r._id}
                            style={[
                              styles.routineChipLarge,
                              isSelected && { borderColor: theme.accent, borderWidth: 2, backgroundColor: '#F0FDF4' }
                            ]}
                            onPress={() => {
                              const newIds = isSelected
                                ? med.routineIds.filter(id => id !== r._id)
                                : [...med.routineIds, r._id];
                              updateMedicine(index, { routineIds: newIds });
                            }}
                          >
                            <View style={styles.routineChipHeader}>
                              <Text style={styles.routineChipTitle}>{r.name}</Text>
                              {isSelected ? (
                                <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                              ) : (
                                <View style={styles.selectionCircle} />
                              )}
                            </View>
                            <View style={styles.routineChipTimeContainer}>
                              <Ionicons name="time" size={22} color={theme.accent} />
                              <Text style={styles.routineChipTime}>
                                {moment(r.time, 'HH:mm').format('hh:mm A')}
                              </Text>
                            </View>
                            <View style={[styles.selectionBadge, isSelected && { backgroundColor: theme.accent }]}>
                              <Text style={[styles.selectionBadgeText, isSelected && { color: 'white' }]}>
                                {isSelected ? 'Selected' : 'Tap to select'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.emptyRoutinesBtn} onPress={() => {/* Setup routines */ }}>
                      <Text style={styles.emptyRoutinesText}>Setup your daily routines first</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{ marginTop: 15 }}>
                  <Text style={styles.subSectionLabel}>Medication Time</Text>
                  <View style={styles.routinesGrid}>
                    {med.times.map((time, tIndex) => (
                      <TouchableOpacity
                        key={tIndex}
                        style={styles.routineChipLarge}
                        onPress={() => {
                          setActivePickerIndex(index);
                          setActiveTimeIndex(tIndex);
                          setShowTimePicker(true);
                        }}
                      >
                        <View style={styles.routineChipHeader}>
                          <Text style={styles.routineChipTitle}>Dose {tIndex + 1}</Text>
                          <Ionicons name="chevron-forward-circle" size={20} color={theme.accent} />
                        </View>
                        <View style={styles.routineChipTimeContainer}>
                          <Ionicons name="time" size={22} color={theme.accent} />
                          <Text style={styles.routineChipTime}>
                            {moment(time, 'HH:mm').format('hh:mm A')}
                          </Text>
                        </View>
                        <View style={styles.selectionBadge}>
                          <Text style={styles.selectionBadgeText}>Tap to change</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.subSectionLabel, { marginTop: 15 }]}>Frequency</Text>
                  {!!errors[`frequency_${index}`] && <Text style={styles.errorText}>{errors[`frequency_${index}`]}</Text>}
                  {renderFrequencyOptions(index)}
                </View>
              )}

              <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                  <Text style={[styles.subSectionLabel, { marginBottom: 0, marginTop: 0 }]}>4.3 Duration Override</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#666', marginRight: 8 }}>Sync with Plan Duration</Text>
                    <Switch
                      value={med.useGroupDuration}
                      onValueChange={(val) => updateMedicine(index, { useGroupDuration: val })}
                      trackColor={{ false: "#ddd", true: theme.accent }}
                      thumbColor="white"
                    />
                  </View>
                </View>
                {!med.useGroupDuration && (
                  <>
                    <Text style={styles.subSectionLabel}>For How Long?</Text>
                    {!!errors[`duration_${index}`] && <Text style={styles.errorText}>{errors[`duration_${index}`]}</Text>}
                    {renderDurationOptions(index)}

                    <Text style={[styles.subSectionLabel, { marginTop: 15 }]}>Start Date</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => {
                        setActivePickerIndex(index);
                        setShowDatePicker(true);
                      }}
                    >
                      <View style={styles.dateIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color={theme.accent} />
                      </View>
                      <Text style={styles.dateButtonText}>Starts {med.startDate.toLocaleDateString()}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                  </>
                )}
                {med.useGroupDuration && (
                  <View style={{ padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center' }}>
                      Shared Plan Duration: {schedule.duration} starting from {schedule.startDate.toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* 5. Type */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>5. Type</Text>
              {!!errors[`type_${index}`] && <Text style={styles.errorText}>{errors[`type_${index}`]}</Text>}
              <View style={styles.typeGrid}>
                {MEDICATION_TYPES.map((medType) => (
                  <TouchableOpacity
                    key={medType.id}
                    style={[styles.typeChip, med.type === medType.label && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => updateMedicine(index, { type: medType.label })}
                  >
                    <View style={[styles.typeIconContainer, med.type === medType.label && { backgroundColor: theme.accent }]}>
                      <Ionicons name={medType.icon} size={20} color={med.type === medType.label ? "white" : theme.accent} />
                    </View>
                    <Text style={[styles.typeChipLabel, med.type === medType.label && { color: "white" }]}>
                      {medType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 6. Color */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>6. Color</Text>
              <View style={styles.colorGrid}>
                {MEDICINE_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorCircle, { backgroundColor: color }, med.color === color && styles.colorCircleActive]}
                    onPress={() => updateMedicine(index, { color })}
                  >
                    {med.color === color && <Ionicons name="checkmark" size={20} color="white" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 7. When to Take */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>7. When to Take</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTimingScroller}>
                {MEAL_TIMINGS.map((timing) => (
                  <TouchableOpacity
                    key={timing.id}
                    style={[styles.mealChip, med.mealTiming.includes(timing.label) && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => {
                      const newTimings = med.mealTiming.includes(timing.label)
                        ? med.mealTiming.filter(t => t !== timing.label)
                        : [...med.mealTiming, timing.label];
                      updateMedicine(index, { mealTiming: newTimings });
                    }}
                  >
                    <View style={[styles.mealChipIcon, med.mealTiming.includes(timing.label) && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Ionicons name={timing.icon} size={20} color={med.mealTiming.includes(timing.label) ? "white" : theme.accent} />
                    </View>
                    <Text style={[styles.mealChipText, med.mealTiming.includes(timing.label) && { color: "white" }]}>
                      {timing.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 8. Refill Tracking */}
            <View style={styles.innerSection}>
              <View style={styles.switchRow}>
                <Text style={styles.innerSectionTitle}>8. Refill Tracking</Text>
                <Switch
                  value={med.refillReminder}
                  onValueChange={(val) => updateMedicine(index, { refillReminder: val })}
                  trackColor={{ false: "#ddd", true: theme.accent }}
                  thumbColor="white"
                />
              </View>
              {med.refillReminder && (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.inputRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.subSectionLabel}>8.1 Current Supply</Text>
                      <View style={[styles.inputContainer, !!errors[`currentSupply_${index}`] && styles.inputError]}>
                        <TextInput
                          style={styles.input}
                          placeholder="0"
                          value={med.currentSupply}
                          onChangeText={(text) => updateMedicine(index, { currentSupply: text })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.subSectionLabel}>8.2 Alert At</Text>
                      <View style={[styles.inputContainer, !!errors[`refillAt_${index}`] && styles.inputError]}>
                        <TextInput
                          style={styles.input}
                          placeholder="0"
                          value={med.refillAt}
                          onChangeText={(text) => updateMedicine(index, { refillAt: text })}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* 9. Prescribed By */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>9. Prescribed By</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Doctor's Name"
                  value={med.prescribedBy}
                  onChangeText={(text) => updateMedicine(index, { prescribedBy: text })}
                />
              </View>
            </View>

            {/* 10. Purpose */}
            <View style={styles.innerSection}>
              <Text style={styles.innerSectionTitle}>10. Purpose</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Fever"
                  value={med.purpose}
                  onChangeText={(text) => updateMedicine(index, { purpose: text })}
                />
              </View>
            </View>

            {/* 11. Notes */}
            <View style={[styles.innerSection, { borderBottomWidth: 0 }]}>
              <Text style={styles.innerSectionTitle}>11. Notes</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Additional instructions..."
                  multiline
                  value={med.notes}
                  onChangeText={(text) => updateMedicine(index, { notes: text })}
                />
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.headerColors} style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {schedule.ownerId === "self" ? "Your Schedule" : `${getPatientName()}'s Plan`}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContentContainer}>
          {/* Patient Info Card */}
          <View style={[styles.patientInfoCard, { borderColor: theme.lightAccent }]}>
            <View style={styles.patientInfoAvatarContainer}>
              {getPatientAvatar() ? (
                <Image source={{ uri: getPatientAvatar() }} style={styles.patientInfoAvatar} />
              ) : (
                <View style={[styles.patientInfoAvatar, styles.patientInfoAvatarPlaceholder, { backgroundColor: theme.lightAccent }]}>
                  <Text style={[styles.patientInfoAvatarText, { color: theme.accent, textAlign: 'center' }]}>{getPatientName().charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.patientInfoContent}>
              <Text style={styles.patientInfoName}>{getPatientName()}</Text>
              <Text style={styles.patientInfoRole}>{theme.label}</Text>
            </View>
            <Ionicons name={schedule.ownerId === "self" ? "heart" : "person-circle"} size={24} color={theme.accent} />
          </View>

          {/* Patient Selection */}
          {!!(managedPatients.length > 0 || patientId) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who is this for?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientSelector} contentContainerStyle={{ paddingBottom: 5 }}>
                <TouchableOpacity
                  key="self"
                  style={[styles.patientChip, schedule.ownerId === "self" && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => setSchedule(prev => ({ ...prev, ownerId: "self" }))}
                >
                  <View style={styles.patientChipContent}>
                    <View style={[styles.patientAvatarMini, { backgroundColor: schedule.ownerId === "self" ? "rgba(255,255,255,0.2)" : theme.lightAccent }]}>
                      <Ionicons name="person" size={12} color={schedule.ownerId === "self" ? "white" : theme.accent} />
                    </View>
                    <Text style={[styles.patientChipText, schedule.ownerId === "self" && styles.patientChipTextActive]}>Me</Text>
                  </View>
                </TouchableOpacity>
                {managedPatients.map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={[styles.patientChip, schedule.ownerId === patient.id && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                    onPress={() => setSchedule(prev => ({ ...prev, ownerId: patient.id }))}
                  >
                    <View style={styles.patientChipContent}>
                      {patient.image ? (
                        <Image source={{ uri: patient.image }} style={styles.patientAvatarMini} />
                      ) : (
                        <View style={[styles.patientAvatarMini, { backgroundColor: schedule.ownerId === patient.id ? "rgba(255,255,255,0.2)" : theme.lightAccent }]}>
                          <Text style={[styles.patientAvatarMiniText, { color: schedule.ownerId === patient.id ? "white" : theme.accent }]}>
                            {patient.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.patientChipText, schedule.ownerId === patient.id && styles.patientChipTextActive]}>
                        {patient.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ======= TREATMENT PLAN SECTION ======= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="folder-outline" size={18} color={theme.accent} />
              {" Treatment Plan"}
            </Text>
            <View style={styles.card}>
              <Text style={styles.subSectionLabel}>Plan Name / Purpose (Optional)</Text>
              <View style={[styles.inputContainer, { marginBottom: 20 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Fever, Pain, Supplements..."
                  value={schedule.name}
                  onChangeText={(text) => setSchedule(prev => ({ ...prev, name: text }))}
                />
              </View>

              <Text style={styles.subSectionLabel}>For How Long?</Text>
              <View style={styles.optionsGrid}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.optionCard, { width: (width - 98) / 2 }, schedule.duration === d.label && styles.selectedOptionCard]}
                    onPress={() => setSchedule(prev => ({ ...prev, duration: d.label }))}
                  >
                    <Text style={[styles.durationNumber, schedule.duration === d.label && styles.selectedDurationNumber]}>
                      {d.value > 0 ? d.value : "∞"}
                    </Text>
                    <Text style={[styles.optionLabel, schedule.duration === d.label && styles.selectedOptionLabel]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.subSectionLabel, { marginTop: 15 }]}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setActivePickerIndex(-1);
                  setShowDatePicker(true);
                }}
              >
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar-outline" size={20} color={theme.accent} />
                </View>
                <Text style={styles.dateButtonText}>Starts {schedule.startDate.toLocaleDateString()}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ======= MEDICINES SECTION ======= */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="medical-outline" size={18} color={theme.accent} />
                {` Medicines (${medicines.length})`}
              </Text>
            </View>

            {medicines.map((med, index) => renderMedicineCard(med, index))}

            {/* Add Another Medicine Button */}
            <TouchableOpacity style={[styles.addAnotherBtn, { borderColor: theme.accent }]} onPress={addAnotherMedicine}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
                <Text style={[styles.addAnotherText, { color: theme.accent }]}>Add Another Medicine</Text>
              </View>
            </TouchableOpacity>
          </View>



          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications-outline" size={18} color={theme.accent} />
              {" Settings"}
            </Text>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={20} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Reminders</Text>
                    <Text style={styles.switchSubLabel}>
                      Get notified when it's time to take your medications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={schedule.reminderEnabled}
                  onValueChange={(value) => setSchedule(prev => ({ ...prev, reminderEnabled: value }))}
                  trackColor={{ false: "#ddd", true: theme.accent }}
                  thumbColor="white"
                />
              </View>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={activePickerIndex === -1 ? schedule.startDate : (activePickerIndex !== null ? medicines[activePickerIndex].startDate : new Date())}
              mode="date"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  if (activePickerIndex === -1) {
                    setSchedule(prev => ({ ...prev, startDate: date }));
                  } else if (activePickerIndex !== null) {
                    updateMedicine(activePickerIndex, { startDate: date });
                  }
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={(() => {
                const times = activePickerIndex !== null ? medicines[activePickerIndex].times : ["09:00"];
                const timeStr = times[activeTimeIndex] || "09:00";
                const [hours, minutes] = timeStr.split(":").map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                return date;
              })()}
              mode="time"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date && activePickerIndex !== null) {
                  const newTime = date.toLocaleTimeString("default", {
                    hour: "2-digit", minute: "2-digit", hour12: false,
                  });
                  const newTimes = [...medicines[activePickerIndex].times];
                  newTimes[activeTimeIndex] = newTime;
                  updateMedicine(activePickerIndex, { times: newTimes });
                }
              }}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <LinearGradient colors={theme.headerColors} style={styles.saveButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.saveButtonText}>
                {isSubmitting
                  ? "Adding..."
                  : medicines.length > 1
                    ? `Add ${medicines.length} Medications`
                    : "Add Medication"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={isSubmitting}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Manage Routines Bottom Sheet */}
      <ManageRoutinesBottomSheet
        visible={showManageRoutines}
        onClose={async (updated) => {
          setShowManageRoutines(false);
          if (updated) {
            const fetchedRoutines = await RoutineService.getRoutines().catch(() => []);
            setRoutines(fetchedRoutines);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerGradient: { paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 80, paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  content: { flex: 1, marginTop: -60 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, zIndex: 1 },
  backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "white", letterSpacing: 0.5 },
  formContainer: { flex: 1 },
  formContentContainer: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 15, marginTop: 10 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  // Medicine Card styles
  medicineCard: {
    backgroundColor: "white", borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    overflow: "hidden",
  },
  medicineCardHeader: {
    flexDirection: "row", alignItems: "center", padding: 16,
  },
  medicineNumberBadge: {
    width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  medicineNumberText: { color: "white", fontWeight: "800", fontSize: 14 },
  medicineHeaderInfo: { flex: 1 },
  medicineHeaderTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  medicineHeaderSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  medicineHeaderActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeMedBtn: { padding: 6, borderRadius: 8, backgroundColor: "#FEE2E2" },
  medicineCardBody: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  innerSection: {
    marginTop: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  innerSectionTitle: {
    fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 12,
  },

  // Add Another Medicine
  addAnotherBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 16,
    borderWidth: 2, borderStyle: "dashed", marginTop: 4, gap: 8,
  },
  addAnotherText: { fontSize: 15, fontWeight: "700" },

  // Input styles
  mainInput: { fontSize: 20, color: "#333", padding: 15 },
  inputContainer: {
    backgroundColor: "white", borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  inputError: { borderColor: "#FF5252" },
  errorText: { color: "#FF5252", fontSize: 12, marginTop: 4, marginLeft: 12 },
  unitLabel: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8, marginTop: 4 },
  unitScroller: { marginBottom: 8 },
  unitChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "white", marginRight: 8,
    borderWidth: 1, borderColor: "#e0e0e0",
  },
  unitChipText: { fontSize: 14, fontWeight: "600", color: "#666" },
  unitChipTextActive: { color: "white" },

  // Type Grid
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    width: (Dimensions.get("window").width - 104) / 4, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "white",
    borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  typeIconContainer: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", justifyContent: "center",
    alignItems: "center", marginBottom: 6,
  },
  typeChipLabel: { fontSize: 11, fontWeight: "600", color: "#333", textAlign: "center" },

  // Color Grid
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  colorCircleActive: {
    borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },

  // Meal Timing
  mealTimingScroller: { flexDirection: "row" },
  mealChip: {
    alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "white",
    marginRight: 10, borderWidth: 1, borderColor: "#e0e0e0", minWidth: 100,
  },
  mealChipIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", justifyContent: "center",
    alignItems: "center", marginBottom: 6,
  },
  mealChipText: { fontSize: 12, fontWeight: "600", color: "#333", textAlign: "center" },

  // Schedule styles
  optionsGrid: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: {
    backgroundColor: "white", borderRadius: 16, padding: 15, margin: 5,
    alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  selectedOptionCard: { backgroundColor: "#059669", borderColor: "#059669" },
  optionIcon: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginBottom: 10,
  },
  selectedOptionIcon: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  selectedOptionLabel: { color: "white" },
  durationNumber: { fontSize: 24, fontWeight: "700", color: "#059669", marginBottom: 5 },
  selectedDurationNumber: { color: "white" },
  dateButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 15,
    marginTop: 15, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  dateIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginRight: 10,
  },
  dateButtonText: { flex: 1, fontSize: 16, color: "#333" },
  timesContainer: { marginTop: 20 },
  timesTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  timeButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 15,
    marginBottom: 10, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  timeIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginRight: 10,
  },
  timeButtonText: { flex: 1, fontSize: 16, color: "#333" },

  // Card, Switch, Refill
  card: {
    backgroundColor: "white", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#e0e0e0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabelContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginRight: 15,
  },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  switchSubLabel: { fontSize: 13, color: "#666", marginTop: 2 },
  refillInputs: { marginTop: 15 },
  inputRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  flex1: { flex: 1 },
  input: { padding: 15, fontSize: 16, color: "#333" },

  // Text Area
  textAreaContainer: {
    backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e0e0e0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginTop: 12,
  },
  textArea: { height: 80, padding: 15, fontSize: 16, color: "#333" },

  // Image
  imageSection: { alignItems: "center", marginVertical: 12 },
  imageContainerSmall: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "white", justifyContent: "center",
    alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", overflow: "hidden",
  },
  medicationImage: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center" },
  imagePlaceholderText: { color: "#059669", fontSize: 10, fontWeight: "600", marginTop: 2 },

  // Footer
  footer: { padding: 20, backgroundColor: "white", borderTopWidth: 1, borderTopColor: "#e0e0e0" },
  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  saveButtonGradient: { paddingVertical: 15, justifyContent: "center", alignItems: "center" },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  saveButtonDisabled: { opacity: 0.7 },
  cancelButton: {
    paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: "#e0e0e0", justifyContent: "center",
    alignItems: "center", backgroundColor: "white",
  },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "600" },

  // Patient Selection
  patientInfoCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, padding: 15,
    marginBottom: 25, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  patientInfoAvatarContainer: { marginRight: 15 },
  patientInfoAvatar: { width: 50, height: 50, borderRadius: 25 },
  patientInfoAvatarPlaceholder: { backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center" },
  patientInfoAvatarText: { fontSize: 20, fontWeight: "700", color: "#059669", textAlign: "center", includeFontPadding: false, lineHeight: 50 },
  patientInfoContent: { flex: 1 },
  patientInfoName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  patientInfoRole: { fontSize: 12, color: "#666", marginTop: 2 },
  patientSelector: { flexDirection: "row", marginBottom: 10 },
  patientChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "white", marginRight: 10,
    borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  patientChipContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  patientChipText: { color: "#666", fontWeight: "600", fontSize: 14 },
  patientChipTextActive: { color: "white" },
  patientAvatarMini: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: "#f0f0f0", justifyContent: "center",
    alignItems: "center", overflow: "hidden",
  },
  patientAvatarMiniText: { fontSize: 10, fontWeight: "700", color: "#666" },
  subSectionLabel: { fontSize: 13, fontWeight: "600", color: "#666", marginBottom: 8, marginTop: 4 },
  scheduleTypeContainer: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 15 },
  scheduleTypeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  scheduleTypeBtnText: { fontSize: 14, fontWeight: '600', color: '#666' },
  routinesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
  routineChipLarge: {
    width: (Dimensions.get("window").width - 88) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  routineChipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  routineChipTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
  },
  selectionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  routineChipTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  routineChipTime: {
    fontSize: 19,
    fontWeight: '900',
    color: '#334155',
  },
  selectionBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  selectionBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  emptyRoutinesBtn: { padding: 20, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', borderRadius: 16 },
  emptyRoutinesText: { color: '#666', fontSize: 14 },
});
