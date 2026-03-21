import { useState, useEffect } from "react";
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
import {
  getMedications,
  updateMedication,
  deleteMedication,
  addMedication,
  getUserProfile,
  getMedicationsByGroupId,
  ManagedPatient,
  Medication,
  UserProfile
} from "../../utils/storage";
import { scheduleMedicationReminder } from "../../utils/notifications";

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
  id: string;
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
  imageUrl?: string;
  isNew?: boolean;
  // Per-medicine schedule override
  customSchedule: boolean;
  frequency: string;
  times: string[];
  duration: string;
  startDate: Date;
}

export default function EditMedicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  // Common group-level fields (including global schedule)
  const [schedule, setSchedule] = useState({
    reminderEnabled: true,
    ownerId: "self",
    scheduleGroupId: undefined as string | undefined,
    addedBy: undefined as 'patient' | 'caregiver' | undefined,
    frequency: "Once daily",
    times: ["09:00"] as string[],
    duration: "30 days",
    startDate: new Date(),
  });

  // Picker management
  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [activePickerIsGlobal, setActivePickerIsGlobal] = useState(true);
  const [activeTimeIndex, setActiveTimeIndex] = useState<number>(0);

  // Per-medicine entries
  const [medicines, setMedicines] = useState<MedicineEntry[]>([]);
  const [expandedMedicine, setExpandedMedicine] = useState(0);
  const [removedMedIds, setRemovedMedIds] = useState<string[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managedPatients, setManagedPatients] = useState<ManagedPatient[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

  const THEMES = {
    self: {
      primary: "#065F46", secondary: "#064E3B", accent: "#059669",
      lightAccent: "#D1FAE5", headerColors: ["#065F46", "#064E3B"] as const,
    },
    other: {
      primary: "#1E40AF", secondary: "#1E3A8A", accent: "#2563EB",
      lightAccent: "#DBEAFE", headerColors: ["#1E40AF", "#1E3A8A"] as const,
    }
  };

  const theme = schedule.ownerId === "self" ? THEMES.self : THEMES.other;

  useEffect(() => {
    const loadData = async () => {
      const profile = await getUserProfile();
      setUserProfile(profile);
      setManagedPatients(profile?.managedPatients || []);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadMedication = async () => {
      const medications = await getMedications();
      const med = medications.find(m => m.id === id);
      if (!med) return;

      // Load common group-level fields
      setSchedule({
        reminderEnabled: med.reminderEnabled,
        ownerId: med.ownerId || "self",
        scheduleGroupId: med.scheduleGroupId,
        addedBy: med.addedBy,
        frequency: med.frequency || "Once daily",
        times: med.times || ["09:00"],
        duration: med.duration || "30 days",
        startDate: med.startDate ? new Date(med.startDate) : new Date(),
      });

      // Check if part of a group
      let medsToEdit: Medication[] = [med];
      if (med.scheduleGroupId) {
        const groupMeds = await getMedicationsByGroupId(med.scheduleGroupId);
        if (groupMeds.length > 0) medsToEdit = groupMeds;
      }

      setMedicines(medsToEdit.map(m => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        dosageUnit: m.dosageUnit || "mg",
        type: m.type || "",
        mealTiming: Array.isArray(m.mealTiming) ? m.mealTiming : (m.mealTiming ? [m.mealTiming] : []),
        prescribedBy: m.prescribedBy || "",
        purpose: m.purpose || "",
        color: m.color || "#4CAF50",
        notes: (m as any).notes || "",
        refillReminder: m.refillReminder,
        currentSupply: m.currentSupply?.toString() || "",
        refillAt: m.refillAt?.toString() || "",
        imageUrl: m.imageUrl,
        customSchedule: false,
        frequency: m.frequency || "Once daily",
        times: m.times || ["09:00"],
        duration: m.duration || "30 days",
        startDate: m.startDate ? new Date(m.startDate) : new Date(),
      })));
      setSelectedFrequency(med.frequency || "Once daily");
      setSelectedDuration(med.duration || "30 days");
    };
    if (id) loadMedication();
  }, [id]);

  const updateMedicine = (index: number, updates: Partial<MedicineEntry>) => {
    setMedicines(prev => prev.map((med, i) => i === index ? { ...med, ...updates } : med));
  };

  const addAnotherMedicine = () => {
    setMedicines(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      name: "", dosage: "", dosageUnit: "mg", type: "", mealTiming: [],
      prescribedBy: "", purpose: "", color: "#4CAF50", notes: "",
      refillReminder: false, currentSupply: "", refillAt: "", isNew: true,
      customSchedule: false,
      frequency: "Once daily", times: ["09:00"], duration: "30 days", startDate: new Date(),
    }]);
    setExpandedMedicine(medicines.length);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length <= 1) return;
    const med = medicines[index];
    if (!med.isNew && med.id) setRemovedMedIds(prev => [...prev, med.id]);
    setMedicines(prev => prev.filter((_, i) => i !== index));
    if (expandedMedicine >= index) {
      setExpandedMedicine(Math.max(0, index - 1));
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
        updateMedicine(medIndex, { imageUrl: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
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
            style={[styles.optionCard, { width: (medIndex === 'global' ? width - 56 : width - 88) / 2 }, freq === f.label && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setFreq(f.label, f.times)}
          >
            <View style={[styles.optionIcon, freq === f.label && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name={f.icon} size={24} color={freq === f.label ? "white" : theme.accent} />
            </View>
            <Text style={[styles.optionLabel, freq === f.label && styles.selectedOptionLabel]}>{f.label}</Text>
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
            style={[styles.optionCard, { width: (medIndex === 'global' ? width - 56 : width - 88) / 2 }, dur === d.label && { backgroundColor: theme.accent, borderColor: theme.accent }]}
            onPress={() => setDur(d.label)}
          >
            <Text style={[styles.durationNumber, dur === d.label && { color: "white" }]}>
              {d.value > 0 ? d.value : "∞"}
            </Text>
            <Text style={[styles.optionLabel, dur === d.label && styles.selectedOptionLabel]}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate global schedule
    if (!schedule.frequency) newErrors['global_frequency'] = "Frequency is required";
    if (!schedule.duration) newErrors['global_duration'] = "Duration is required";

    medicines.forEach((med, index) => {
      if (!med.name.trim()) newErrors[`name_${index}`] = "Medication name is required";
      if (!med.dosage.trim()) newErrors[`dosage_${index}`] = "Dosage is required";
      if (med.customSchedule) {
        if (!med.frequency) newErrors[`frequency_${index}`] = "Frequency is required";
        if (!med.duration) newErrors[`duration_${index}`] = "Duration is required";
      }
      if (med.refillReminder) {
        if (!med.currentSupply) newErrors[`currentSupply_${index}`] = "Required";
        if (!med.refillAt) newErrors[`refillAt_${index}`] = "Required";
        if (Number(med.refillAt) >= Number(med.currentSupply)) newErrors[`refillAt_${index}`] = "Alert < supply";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fill in all required fields correctly");
      return;
    }
    setIsSubmitting(true);
    try {
      // Delete removed medicines
      for (const removedId of removedMedIds) {
        await deleteMedication(removedId);
      }

      // Determine group ID
      let groupId = schedule.scheduleGroupId;
      if (medicines.length > 1 && !groupId) {
        groupId = Math.random().toString(36).substr(2, 9);
      }
      if (medicines.length <= 1) {
        groupId = undefined;
      }

      for (const med of medicines) {
        const useCustom = med.customSchedule;
        const medicationData: Medication = {
          id: med.id,
          scheduleGroupId: groupId,
          name: med.name,
          dosage: med.dosage,
          dosageUnit: med.dosageUnit,
          type: med.type,
          mealTiming: med.mealTiming,
          prescribedBy: med.prescribedBy,
          purpose: med.purpose,
          color: med.color,
          notes: med.notes,
          imageUrl: med.imageUrl,
          refillReminder: med.refillReminder,
          currentSupply: Number(med.currentSupply) || 0,
          totalSupply: Number(med.currentSupply) || 0,
          refillAt: Number(med.refillAt) || 0,
          frequency: med.customSchedule ? med.frequency : schedule.frequency,
          times: med.customSchedule ? med.times : schedule.times,
          duration: med.customSchedule ? med.duration : schedule.duration,
          startDate: (med.customSchedule ? med.startDate : schedule.startDate).toISOString(),
          reminderEnabled: schedule.reminderEnabled,
          ownerId: schedule.ownerId,
          addedBy: schedule.addedBy,
        };

        if (med.isNew) {
          await addMedication(medicationData);
        } else {
          await updateMedication(medicationData);
        }

        // Reschedule reminders for updated medication
        if (medicationData.reminderEnabled) {
          await scheduleMedicationReminder(medicationData);
        }
      }

      setIsSubmitting(false);
      Alert.alert("Success", "Medications updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Update error:", error);
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to update medications");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      medicines.length > 1
        ? "This will delete all medicines in this schedule group. Continue?"
        : "Are you sure you want to delete this medication?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              for (const med of medicines) {
                if (!med.isNew) await deleteMedication(med.id);
              }
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete medication");
            }
          }
        }
      ]
    );
  };

  const renderMedicineCard = (med: MedicineEntry, index: number) => {
    const isExpanded = expandedMedicine === index;
    return (
      <View key={med.id} style={[styles.medicineCard, errors[`name_${index}`] && { borderColor: "#FF5252" }]}>
        <TouchableOpacity style={styles.medicineCardHeader} onPress={() => setExpandedMedicine(isExpanded ? -1 : index)}>
          <View style={[styles.medicineNumberBadge, { backgroundColor: med.color || theme.lightAccent }]}>
            <Text style={styles.medicineNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.medicineHeaderInfo}>
            <Text style={styles.medicineHeaderTitle}>{med.name || `Medicine ${index + 1}`}</Text>
            {med.dosage ? <Text style={styles.medicineHeaderSubtitle}>{med.dosage} {med.dosageUnit}</Text> : null}
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

        {isExpanded && (
          <View style={styles.medicineCardBody}>
            {/* Image Picker */}
            <View style={styles.imageSection}>
              <TouchableOpacity style={styles.imageContainerSmall} onPress={() => pickImage(index)}>
                {med.imageUrl ? (
                  <Image source={{ uri: med.imageUrl }} style={styles.medicationImage} />
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
              <TextInput style={[styles.mainInput, errors[`name_${index}`] && styles.inputError]} placeholder="Medication Name" placeholderTextColor="#999" value={med.name}
                onChangeText={(text) => updateMedicine(index, { name: text })} />
            </View>

            {/* Dosage */}
            <View style={styles.inputContainer}>
              <TextInput style={[styles.mainInput, errors[`dosage_${index}`] && styles.inputError]} placeholder="Dosage (e.g., 500)" placeholderTextColor="#999" value={med.dosage}
                onChangeText={(text) => updateMedicine(index, { dosage: text })} keyboardType="numeric" />
            </View>

            {/* Dosage Unit */}
            <Text style={styles.unitLabel}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroller}>
              {DOSAGE_UNITS.map((unit) => (
                <TouchableOpacity key={unit} style={[styles.unitChip, med.dosageUnit === unit && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => updateMedicine(index, { dosageUnit: unit })}>
                  <Text style={[styles.unitChipText, med.dosageUnit === unit && { color: "white" }]}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Schedule Section */}
            <View style={styles.innerSection}>
              {/* Customize Schedule Toggle */}
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.lightAccent }]}>
                    <Ionicons name="calendar-outline" size={20} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={styles.switchLabel}>Custom Schedule</Text>
                    <Text style={styles.switchSubLabel}>Set a different start date for this medication</Text>
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
                  <Text style={styles.innerSectionTitle}>Frequency</Text>
                  {errors[`frequency_${index}`] && <Text style={styles.errorText}>{errors[`frequency_${index}`]}</Text>}
                  {renderFrequencyOptions(index)}

                  <Text style={styles.innerSectionTitle}>For How Long?</Text>
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
                    <View style={[styles.dateIconContainer, { backgroundColor: theme.lightAccent }]}>
                      <Ionicons name="calendar" size={20} color={theme.accent} />
                    </View>
                    <Text style={styles.dateButtonText}>Starts {med.startDate.toLocaleDateString()}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>

                </View>
              )}
            </View>

            {/* Medication Type */}
            <Text style={styles.sectionTitle}><Ionicons name="medkit-outline" size={18} color={theme.accent} />{" "}Type</Text>
            <View style={styles.typeGrid}>
              {MEDICATION_TYPES.map((medType) => (
                <TouchableOpacity key={medType.id} style={[styles.typeChip, med.type === medType.label && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => updateMedicine(index, { type: medType.label })}>
                  <View style={[styles.typeIconContainer, med.type === medType.label && { backgroundColor: theme.lightAccent }]}>
                    <Ionicons name={medType.icon} size={20} color={med.type === medType.label ? "white" : theme.accent} />
                  </View>
                  <Text style={[styles.typeChipLabel, med.type === medType.label && { color: "white" }]}>{medType.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={styles.sectionTitle}><Ionicons name="color-palette-outline" size={18} color={theme.accent} />{" "}Color</Text>
            <View style={styles.colorGrid}>
              {MEDICINE_COLORS.map((color) => (
                <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, med.color === color && styles.colorCircleActive]}
                  onPress={() => updateMedicine(index, { color })}>
                  {med.color === color && <Ionicons name="checkmark" size={20} color="white" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Meal Timing */}
            <Text style={styles.sectionTitle}><Ionicons name="restaurant-outline" size={18} color={theme.accent} />{" "}When to Take</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTimingScroller}>
              {MEAL_TIMINGS.map((timing) => (
                <TouchableOpacity key={timing.id}
                  style={[styles.mealChip, med.mealTiming.includes(timing.label) && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  onPress={() => {
                    const newTimings = med.mealTiming.includes(timing.label)
                      ? med.mealTiming.filter(t => t !== timing.label)
                      : [...med.mealTiming, timing.label];
                    updateMedicine(index, { mealTiming: newTimings });
                  }}>
                  <View style={[styles.mealChipIcon, med.mealTiming.includes(timing.label) && { backgroundColor: theme.lightAccent }]}>
                    <Ionicons name={timing.icon} size={20} color={med.mealTiming.includes(timing.label) ? "white" : theme.accent} />
                  </View>
                  <Text style={[styles.mealChipText, med.mealTiming.includes(timing.label) && { color: "white" }]}>{timing.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Refill */}
            <View style={[styles.card, { marginTop: 20, marginBottom: 8 }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.lightAccent }]}>
                    <Ionicons name="reload" size={20} color={theme.accent} />
                  </View>
                  <View><Text style={styles.switchLabel}>Refill Tracking</Text></View>
                </View>
                <Switch value={med.refillReminder} onValueChange={(value) => updateMedicine(index, { refillReminder: value })}
                  trackColor={{ false: "#ddd", true: theme.accent }} thumbColor="white" />
              </View>
              {med.refillReminder && (
                <View style={styles.refillInputs}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput style={styles.input} placeholder="Current Supply" placeholderTextColor="#999" value={med.currentSupply}
                        onChangeText={(text) => updateMedicine(index, { currentSupply: text })} keyboardType="numeric" />
                    </View>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput style={styles.input} placeholder="Alert at" placeholderTextColor="#999" value={med.refillAt}
                        onChangeText={(text) => updateMedicine(index, { refillAt: text })} keyboardType="numeric" />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Additional Details */}
            <View style={[styles.inputContainer, { marginTop: 12 }]}>
              <TextInput style={styles.mainInput} placeholder="Prescribed By" placeholderTextColor="#999" value={med.prescribedBy}
                onChangeText={(text) => updateMedicine(index, { prescribedBy: text })} />
            </View>
            <View style={styles.inputContainer}>
              <TextInput style={styles.mainInput} placeholder="Purpose" placeholderTextColor="#999" value={med.purpose}
                onChangeText={(text) => updateMedicine(index, { purpose: text })} />
            </View>
            <View style={[styles.textAreaContainer, { marginTop: 12 }]}>
              <TextInput style={styles.textArea} placeholder="Notes..." placeholderTextColor="#999" value={med.notes}
                onChangeText={(text) => updateMedicine(index, { notes: text })} multiline numberOfLines={3} textAlignVertical="top" />
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
            {schedule.ownerId === "self" ? "Edit Schedule" : `For ${getPatientName()}`}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContentContainer}>
          {/* Patient Info */}
          <View style={styles.patientInfoCard}>
            <View style={styles.patientInfoAvatarContainer}>
              {getPatientAvatar() ? (
                <Image source={{ uri: getPatientAvatar() }} style={styles.patientInfoAvatar} />
              ) : (
                <View style={[styles.patientInfoAvatar, styles.patientInfoAvatarPlaceholder, { backgroundColor: theme.lightAccent }]}>
                  <Text style={[styles.patientInfoAvatarText, { color: theme.accent }]}>{getPatientName().charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.patientInfoContent}>
              <Text style={styles.patientInfoName}>{getPatientName()}</Text>
              <Text style={styles.patientInfoRole}>{schedule.ownerId === "self" ? "Personal" : "Managed Patient"}</Text>
            </View>
          </View>

          {/* Medicines Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="medical-outline" size={18} color={theme.accent} />{" "}
              Medicines ({medicines.length})
            </Text>
            {medicines.map((med, index) => renderMedicineCard(med, index))}
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

            <Text style={styles.sectionTitle}>Frequency</Text>
            {errors['global_frequency'] && <Text style={styles.errorText}>{errors['global_frequency']}</Text>}
            {renderFrequencyOptions('global')}

            <Text style={styles.sectionTitle}>For How Long?</Text>
            {errors['global_duration'] && <Text style={styles.errorText}>{errors['global_duration']}</Text>}
            {renderDurationOptions('global')}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setActivePickerIsGlobal(true);
                setShowDatePicker(true);
              }}
            >
              <View style={[styles.dateIconContainer, { backgroundColor: theme.lightAccent }]}>
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
                    <View style={[styles.timeIconContainer, { backgroundColor: theme.lightAccent }]}>
                      <Ionicons name="time-outline" size={20} color={theme.accent} />
                    </View>
                    <Text style={styles.timeButtonText}>{time}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications-outline" size={18} color={theme.accent} />{" "}
              Settings
            </Text>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.lightAccent }]}>
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

          <View style={{ height: 100 }} />

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
          <TouchableOpacity style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]} onPress={handleSave} disabled={isSubmitting}>
            <LinearGradient colors={theme.headerColors} style={styles.saveButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Updating..." : medicines.length > 1 ? `Update ${medicines.length} Medications` : "Update Medication"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isSubmitting}>
            <Ionicons name="trash-outline" size={20} color="#E91E63" style={{ marginRight: 6 }} />
            <Text style={styles.deleteButtonText}>Delete {medicines.length > 1 ? "All" : "Medication"}</Text>
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
  mainInput: { fontSize: 20, color: "#333", padding: 15 },
  inputError: { borderColor: "#E91E63", borderWidth: 1 },

  // Medicine Card
  medicineCard: { backgroundColor: "white", borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, overflow: "hidden" },
  medicineCardHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  medicineNumberBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 12 },
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
  errorText: { color: "#FF5252", fontSize: 12, marginTop: 4, marginLeft: 12 },
  addAnotherBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", marginTop: 4, gap: 8 },
  addAnotherText: { fontSize: 15, fontWeight: "700" },

  // Options
  optionsGrid: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: { backgroundColor: "white", borderRadius: 16, padding: 15, margin: 5, alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  selectedOptionCard: { backgroundColor: "#059669", borderColor: "#059669" },
  optionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  selectedOptionLabel: { color: "white" },
  durationNumber: { fontSize: 24, fontWeight: "700", color: "#059669", marginBottom: 5 },
  inputContainer: { backgroundColor: "white", borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dateButton: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 15, marginTop: 15, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  dateIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 10 },
  dateButtonText: { flex: 1, fontSize: 16, color: "#333" },
  card: { backgroundColor: "white", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switchLabelContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 15 },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  switchSubLabel: { fontSize: 13, color: "#666", marginTop: 2 },
  inputRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  flex1: { flex: 1 },
  input: { padding: 15, fontSize: 16, color: "#333" },
  textAreaContainer: { backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  textArea: { padding: 15, fontSize: 16, color: "#333", height: 80 },
  timesContainer: { marginTop: 20 },
  timesTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  timeButton: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  timeIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginRight: 10 },
  timeButtonText: { flex: 1, fontSize: 16, color: "#333" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "white", padding: 20, borderTopWidth: 1, borderTopColor: "#e0e0e0", paddingBottom: Platform.OS === "ios" ? 40 : 20 },
  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonGradient: { paddingVertical: 16, alignItems: "center" },
  saveButtonText: { color: "white", fontSize: 18, fontWeight: "700" },
  deleteButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  deleteButtonText: { color: "#E91E63", fontSize: 16, fontWeight: "600" },
  refillInputs: { marginTop: 10 },
  unitLabel: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8, marginTop: 4 },
  unitScroller: { marginBottom: 8 },
  unitChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "white", marginRight: 8, borderWidth: 1, borderColor: "#e0e0e0" },
  unitChipText: { fontSize: 14, fontWeight: "600", color: "#666" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { width: (width - 102) / 4, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "white", borderWidth: 1, borderColor: "#e0e0e0" },
  typeIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  typeChipLabel: { fontSize: 11, fontWeight: "600", color: "#333", textAlign: "center" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  colorCircleActive: { borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  mealTimingScroller: { flexDirection: "row" },
  mealChip: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "white", marginRight: 10, borderWidth: 1, borderColor: "#e0e0e0", minWidth: 100 },
  mealChipIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  mealChipText: { fontSize: 12, fontWeight: "600", color: "#333", textAlign: "center" },
  patientInfoCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 20, padding: 15, marginBottom: 25, borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  patientInfoAvatarContainer: { marginRight: 15 },
  patientInfoAvatar: { width: 50, height: 50, borderRadius: 25 },
  patientInfoAvatarPlaceholder: { backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center" },
  patientInfoAvatarText: { fontSize: 20, fontWeight: "700", textAlign: "center", includeFontPadding: false, lineHeight: 50 },
  patientInfoContent: { flex: 1 },
  patientInfoName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  patientInfoRole: { fontSize: 12, color: "#666", marginTop: 2 },

  // Image
  imageSection: { alignItems: "center", marginVertical: 12 },
  imageContainerSmall: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "white", justifyContent: "center",
    alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", overflow: "hidden",
  },
  medicationImage: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center" },
  imagePlaceholderText: { color: "#059669", fontSize: 10, fontWeight: "600", marginTop: 2 },
});
