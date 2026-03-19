import { useState } from "react";
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
  KeyboardAvoidingView,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import {
  addMedication,
  addMedicationGroup,
  getMedications,
  updateMedication,
  deleteMedication,
  getUserProfile,
  ManagedPatient,
  Medication,
  UserProfile
} from "../../utils/storage";
import { useCallback, useEffect } from "react";
import {
  scheduleMedicationReminder,
  scheduleRefillReminder,
} from "../../utils/notifications";

const { width } = Dimensions.get("window");

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
  // Per-medicine schedule override
  customSchedule: boolean;
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
  customSchedule: false,
  frequency: "Once daily",
  times: ["09:00"],
  duration: "30 days",
  startDate: new Date(),
});

export default function AddMedicationScreen() {
  const router = useRouter();

  // Common group-level fields (including global schedule)
  const [schedule, setSchedule] = useState({
    reminderEnabled: true,
    ownerId: "self",
    frequency: "Once daily",
    times: ["09:00"] as string[],
    duration: "30 days",
    startDate: new Date(),
  });

  // Per-medicine fields
  const [medicines, setMedicines] = useState<MedicineEntry[]>([createEmptyMedicine()]);
  const [expandedMedicine, setExpandedMedicine] = useState(0);

  // Picker management
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [activePickerIsGlobal, setActivePickerIsGlobal] = useState(true);
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
    const loadPatients = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
      setManagedPatients(profile?.managedPatients || []);
      if (patientId) {
        setSchedule(prev => ({ ...prev, ownerId: patientId }));
      }
    };
    loadPatients();
  }, [patientId]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Validate global schedule
    if (!schedule.frequency) {
      newErrors['global_frequency'] = "Frequency is required";
    }
    if (!schedule.duration) {
      newErrors['global_duration'] = "Duration is required";
    }

    // Validate each medicine
    medicines.forEach((med, index) => {
      if (!med.name.trim()) {
        newErrors[`name_${index}`] = "Medication name is required";
      }
      if (!med.dosage.trim()) {
        newErrors[`dosage_${index}`] = "Dosage is required";
      }
      // Validate per-medicine schedule if custom
      if (med.customSchedule) {
        if (!med.frequency) {
          newErrors[`frequency_${index}`] = "Frequency is required";
        }
        if (!med.duration) {
          newErrors[`duration_${index}`] = "Duration is required";
        }
      }
      if (med.refillReminder) {
        if (!med.currentSupply) {
          newErrors[`currentSupply_${index}`] = "Current supply is required for refill tracking";
        }
        if (!med.refillAt) {
          newErrors[`refillAt_${index}`] = "Refill alert threshold is required";
        }
        if (Number(med.refillAt) >= Number(med.currentSupply)) {
          newErrors[`refillAt_${index}`] = "Refill alert must be less than current supply";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        Alert.alert("Error", "Please fill in all required fields correctly");
        return;
      }
      if (isSubmitting) return;
      setIsSubmitting(true);

      const medicationDataList: Medication[] = medicines.map(med => {
        const useCustom = med.customSchedule;
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: med.name,
          dosage: med.dosage,
          dosageUnit: med.dosageUnit,
          type: med.type,
          mealTiming: med.mealTiming,
          prescribedBy: med.prescribedBy,
          purpose: med.purpose,
          color: med.color,
          notes: med.notes,
          imageUrl: med.imageUri || undefined,
          refillReminder: med.refillReminder,
          currentSupply: med.currentSupply ? Number(med.currentSupply) : 0,
          totalSupply: med.currentSupply ? Number(med.currentSupply) : 0,
          refillAt: med.refillAt ? Number(med.refillAt) : 0,
          // Use per-medicine or global schedule
          frequency: useCustom ? med.frequency : schedule.frequency,
          times: useCustom ? med.times : schedule.times,
          duration: useCustom ? med.duration : schedule.duration,
          startDate: (useCustom ? med.startDate : schedule.startDate).toISOString(),
          reminderEnabled: schedule.reminderEnabled,
          ownerId: schedule.ownerId,
          addedBy: (schedule.ownerId === "self" ? 'patient' : 'caregiver') as 'patient' | 'caregiver',
        };
      });

      if (medicationDataList.length > 1) {
        await addMedicationGroup(medicationDataList);
      } else {
        await addMedication(medicationDataList[0]);
      }

      // Schedule reminders — consolidate group names for a single notification
      const allMedNames = medicationDataList.map(m => m.name);
      for (const medicationData of medicationDataList) {
        if (medicationData.reminderEnabled) {
          await scheduleMedicationReminder(
            medicationData,
            medicationDataList.length > 1 ? allMedNames : undefined
          );
        }
        if (medicationData.refillReminder) {
          await scheduleRefillReminder(medicationData);
        }
      }

      Alert.alert(
        "Success",
        medicines.length > 1
          ? `${medicines.length} medications added successfully`
          : "Medication added successfully",
        [{ text: "OK", onPress: () => router.back() }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "Failed to save medication. Please try again.", [{ text: "OK" }], { cancelable: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFrequencyOptions = (medIndex: number | 'global') => {
    const freq = medIndex === 'global' ? schedule.frequency : medicines[medIndex].frequency;

    const setFreq = (label: string, times: string[]) => {
      if (medIndex === 'global') {
        setSchedule(prev => ({ ...prev, frequency: label, times }));
      } else {
        updateMedicine(medIndex, { frequency: label, times });
      }
    };

    return (
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.optionCard, freq === f.label && styles.selectedOptionCard]}
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

  const renderDurationOptions = (medIndex: number | 'global') => {
    const dur = medIndex === 'global' ? schedule.duration : medicines[medIndex].duration;
    const setDur = (label: string) => {
      if (medIndex === 'global') {
        setSchedule(prev => ({ ...prev, duration: label }));
      } else {
        updateMedicine(medIndex, { duration: label });
      }
    };
    return (
      <View style={styles.optionsGrid}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.optionCard, dur === d.label && styles.selectedOptionCard]}
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
    const hasError = errors[`name_${index}`] || errors[`dosage_${index}`];

    return (
      <View key={index} style={[styles.medicineCard, hasError && { borderColor: "#FF5252" }]}>
        {/* Medicine Card Header */}
        <TouchableOpacity
          style={styles.medicineCardHeader}
          onPress={() => setExpandedMedicine(isExpanded ? -1 : index)}
        >
          <View style={[styles.medicineNumberBadge, { backgroundColor: med.color || theme.lightAccent }]}>
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
            {/* Image Picker */}
            <View style={styles.imageSection}>
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

            {/* Name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors[`name_${index}`] && styles.inputError]}
                placeholder="Medication Name"
                placeholderTextColor="#999"
                value={med.name}
                onChangeText={(text) => {
                  updateMedicine(index, { name: text });
                  if (errors[`name_${index}`]) setErrors(prev => ({ ...prev, [`name_${index}`]: "" }));
                }}
              />
              {errors[`name_${index}`] && <Text style={styles.errorText}>{errors[`name_${index}`]}</Text>}
            </View>

            {/* Dosage */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors[`dosage_${index}`] && styles.inputError]}
                placeholder="Dosage (e.g., 500)"
                placeholderTextColor="#999"
                value={med.dosage}
                onChangeText={(text) => {
                  updateMedicine(index, { dosage: text });
                  if (errors[`dosage_${index}`]) setErrors(prev => ({ ...prev, [`dosage_${index}`]: "" }));
                }}
                keyboardType="numeric"
              />
              {errors[`dosage_${index}`] && <Text style={styles.errorText}>{errors[`dosage_${index}`]}</Text>}
            </View>

            {/* Dosage Units */}
            <Text style={styles.unitLabel}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroller}>
              {DOSAGE_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitChip, med.dosageUnit === unit && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => updateMedicine(index, { dosageUnit: unit })}
                >
                  <Text style={[styles.unitChipText, med.dosageUnit === unit && styles.unitChipTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Schedule Section */}
            <View style={styles.innerSection}>
              {/* Customize Schedule Toggle */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar-outline" size={20} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={styles.switchLabel}>Custom Schedule</Text>
                    <Text style={styles.switchSubLabel}>Override global schedule for this medicine</Text>
                  </View>
                </View>
                <Switch
                  value={med.customSchedule}
                  onValueChange={(value) => updateMedicine(index, { customSchedule: value })}
                  trackColor={{ false: "#ddd", true: theme.accent }}
                  thumbColor="white"
                />
              </View>

              {med.customSchedule && (
                <View style={{ marginTop: 15 }}>
                  <Text style={styles.sectionTitle}>How often?</Text>
                  {errors[`frequency_${index}`] && <Text style={styles.errorText}>{errors[`frequency_${index}`]}</Text>}
                  {renderFrequencyOptions(index)}

                  <Text style={styles.sectionTitle}>For how long?</Text>
                  {errors[`duration_${index}`] && <Text style={styles.errorText}>{errors[`duration_${index}`]}</Text>}
                  {renderDurationOptions(index)}

                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => {
                      setActivePickerIndex(index);
                      setActivePickerIsGlobal(false);
                      setShowDatePicker(true);
                    }}
                  >
                    <View style={styles.dateIconContainer}>
                      <Ionicons name="calendar" size={20} color={theme.accent} />
                    </View>
                    <Text style={styles.dateButtonText}>Starts {med.startDate.toLocaleDateString()}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>

                  {med.frequency && med.frequency !== "As needed" && (
                    <View style={styles.timesContainer}>
                      <Text style={styles.timesTitle}>Medication Times</Text>
                      {med.times.map((time, tIndex) => (
                        <TouchableOpacity
                          key={tIndex}
                          style={styles.timeButton}
                          onPress={() => {
                            setActivePickerIndex(index);
                            setActivePickerIsGlobal(false);
                            setActiveTimeIndex(tIndex);
                            setShowTimePicker(true);
                          }}
                        >
                          <View style={styles.timeIconContainer}>
                            <Ionicons name="time-outline" size={20} color={theme.accent} />
                          </View>
                          <Text style={styles.timeButtonText}>{time}</Text>
                          <Ionicons name="chevron-forward" size={20} color="#666" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Medication Type */}
            <Text style={styles.sectionTitle}>
              <Ionicons name="medkit-outline" size={18} color={theme.accent} />{" "}Type
            </Text>
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

            {/* Medicine Color */}
            <Text style={styles.sectionTitle}>
              <Ionicons name="color-palette-outline" size={18} color={theme.accent} />{" "}Color
            </Text>
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

            {/* Meal Timing */}
            <Text style={styles.sectionTitle}>
              <Ionicons name="restaurant-outline" size={18} color={theme.accent} />{" "}When to Take
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTimingScroller}>
              {MEAL_TIMINGS.map((timing) => (
                <TouchableOpacity
                  key={timing.id}
                  style={[styles.mealChip, med.mealTiming.includes(timing.label) && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => {
                    const newTimings = med.mealTiming.includes(timing.label)
                      ? med.mealTiming.filter((t: string) => t !== timing.label)
                      : [...med.mealTiming, timing.label];
                    updateMedicine(index, { mealTiming: newTimings });
                  }}
                >
                  <View style={[styles.mealChipIcon, med.mealTiming.includes(timing.label) && { backgroundColor: theme.accent }]}>
                    <Ionicons name={timing.icon} size={20} color={med.mealTiming.includes(timing.label) ? "white" : theme.accent} />
                  </View>
                  <Text style={[styles.mealChipText, med.mealTiming.includes(timing.label) && { color: "white" }]}>
                    {timing.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Refill Tracking */}
            <View style={[styles.card, { marginTop: 20, marginBottom: 8 }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="reload" size={20} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={styles.switchLabel}>Refill Tracking</Text>
                    <Text style={styles.switchSubLabel}>Get notified when you need to refill</Text>
                  </View>
                </View>
                <Switch
                  value={med.refillReminder}
                  onValueChange={(value) => updateMedicine(index, { refillReminder: value })}
                  trackColor={{ false: "#ddd", true: theme.accent }}
                  thumbColor="white"
                />
              </View>
              {med.refillReminder && (
                <View style={styles.refillInputs}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[styles.input, errors[`currentSupply_${index}`] && styles.inputError]}
                        placeholder="Current Supply"
                        placeholderTextColor="#999"
                        value={med.currentSupply}
                        onChangeText={(text) => updateMedicine(index, { currentSupply: text })}
                        keyboardType="numeric"
                      />
                      {errors[`currentSupply_${index}`] && <Text style={styles.errorText}>{errors[`currentSupply_${index}`]}</Text>}
                    </View>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[styles.input, errors[`refillAt_${index}`] && styles.inputError]}
                        placeholder="Alert at"
                        placeholderTextColor="#999"
                        value={med.refillAt}
                        onChangeText={(text) => updateMedicine(index, { refillAt: text })}
                        keyboardType="numeric"
                      />
                      {errors[`refillAt_${index}`] && <Text style={styles.errorText}>{errors[`refillAt_${index}`]}</Text>}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Additional Details */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                placeholder="Prescribed By (Doctor's Name)"
                placeholderTextColor="#999"
                value={med.prescribedBy}
                onChangeText={(text) => updateMedicine(index, { prescribedBy: text })}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                placeholder="Purpose (e.g., Blood Pressure)"
                placeholderTextColor="#999"
                value={med.purpose}
                onChangeText={(text) => updateMedicine(index, { purpose: text })}
              />
            </View>

            {/* Notes */}
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Add notes or special instructions..."
                placeholderTextColor="#999"
                value={med.notes}
                onChangeText={(text) => updateMedicine(index, { notes: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
          {(managedPatients.length > 0 || patientId) && (
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

          {/* ======= MEDICINES SECTION ======= */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="medical-outline" size={18} color={theme.accent} />{" "}
                Medicines ({medicines.length})
              </Text>
            </View>

            {medicines.map((med, index) => renderMedicineCard(med, index))}

            {/* Add Another Medicine Button */}
            <TouchableOpacity style={[styles.addAnotherBtn, { borderColor: theme.accent }]} onPress={addAnotherMedicine}>
              <Ionicons name="add-circle-outline" size={22} color={theme.accent} />
              <Text style={[styles.addAnotherText, { color: theme.accent }]}>Add Another Medicine</Text>
            </TouchableOpacity>
          </View>

          {/* ======= GLOBAL SCHEDULE SECTION ======= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar-outline" size={18} color={theme.accent} />{" "}
              Schedule
            </Text>

            <Text style={styles.sectionTitle}>How often?</Text>
            {errors['global_frequency'] && <Text style={styles.errorText}>{errors['global_frequency']}</Text>}
            {renderFrequencyOptions('global')}

            <Text style={styles.sectionTitle}>For how long?</Text>
            {errors['global_duration'] && <Text style={styles.errorText}>{errors['global_duration']}</Text>}
            {renderDurationOptions('global')}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setActivePickerIsGlobal(true);
                setShowDatePicker(true);
              }}
            >
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar" size={20} color={theme.accent} />
              </View>
              <Text style={styles.dateButtonText}>Starts {schedule.startDate.toLocaleDateString()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {schedule.frequency && schedule.frequency !== "As needed" && (
              <View style={styles.timesContainer}>
                <Text style={styles.timesTitle}>Medication Times</Text>
                {schedule.times.map((time, tIndex) => (
                  <TouchableOpacity
                    key={tIndex}
                    style={styles.timeButton}
                    onPress={() => {
                      setActivePickerIsGlobal(true);
                      setActiveTimeIndex(tIndex);
                      setShowTimePicker(true);
                    }}
                  >
                    <View style={styles.timeIconContainer}>
                      <Ionicons name="time-outline" size={20} color={theme.accent} />
                    </View>
                    <Text style={styles.timeButtonText}>{time}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications-outline" size={18} color={theme.accent} />{" "}
              Settings
            </Text>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={20} color={theme.accent} />
                  </View>
                  <View>
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
              value={activePickerIsGlobal ? schedule.startDate : (activePickerIndex !== null ? medicines[activePickerIndex].startDate : new Date())}
              mode="date"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  if (activePickerIsGlobal) {
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
                const times = activePickerIsGlobal ? schedule.times : (activePickerIndex !== null ? medicines[activePickerIndex].times : ["09:00"]);
                const [hours, minutes] = times[activeTimeIndex].split(":").map(Number);
                const date = new Date();
                date.setHours(hours, minutes, 0, 0);
                return date;
              })()}
              mode="time"
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date) {
                  const newTime = date.toLocaleTimeString("default", {
                    hour: "2-digit", minute: "2-digit", hour12: false,
                  });
                  if (activePickerIsGlobal) {
                    const newTimes = [...schedule.times];
                    newTimes[activeTimeIndex] = newTime;
                    setSchedule(prev => ({ ...prev, times: newTimes }));
                  } else if (activePickerIndex !== null) {
                    const newTimes = [...medicines[activePickerIndex].times];
                    newTimes[activeTimeIndex] = newTime;
                    updateMedicine(activePickerIndex, { times: newTimes });
                  }
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
    marginTop: 15, paddingVertical: 15, borderTopWidth: 1, borderTopColor: "#f0f0f0",
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
    width: (width - 104) / 4, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "white",
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
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: {
    width: (width - 102) / 2, backgroundColor: "white", borderRadius: 16, padding: 15, margin: 5,
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
  switchSubLabel: { fontSize: 13, color: "#666", marginTop: 2, maxWidth: 200 },
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
});
