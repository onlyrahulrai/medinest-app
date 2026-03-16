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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { 
  getMedications, 
  updateMedication, 
  deleteMedication, 
  Medication 
} from "../../utils/storage";

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
  {
    id: "1",
    label: "Once daily",
    icon: "sunny-outline" as const,
    times: ["09:00"],
  },
  {
    id: "2",
    label: "Twice daily",
    icon: "sync-outline" as const,
    times: ["09:00", "21:00"],
  },
  {
    id: "3",
    label: "Three times daily",
    icon: "time-outline" as const,
    times: ["09:00", "15:00", "21:00"],
  },
  {
    id: "4",
    label: "Four times daily",
    icon: "repeat-outline" as const,
    times: ["09:00", "13:00", "17:00", "21:00"],
  },
  { id: "5", label: "As needed", icon: "calendar-outline" as const, times: [] },
];

const DURATIONS = [
  { id: "1", label: "7 days", value: 7 },
  { id: "2", label: "14 days", value: 14 },
  { id: "3", label: "30 days", value: 30 },
  { id: "4", label: "90 days", value: 90 },
  { id: "5", label: "Ongoing", value: -1 },
];

export default function EditMedicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [form, setForm] = useState<{
    name: string;
    dosage: string;
    dosageUnit: string;
    type: string;
    mealTiming: string[];
    prescribedBy: string;
    purpose: string;
    color: string;
    frequency: string;
    duration: string;
    startDate: Date;
    times: string[];
    notes: string;
    reminderEnabled: boolean;
    refillReminder: boolean;
    currentSupply: string;
    refillAt: string;
    ownerId: string;
    imageUrl?: string;
    addedBy?: 'patient' | 'caregiver';
  }>({
    name: "",
    dosage: "",
    dosageUnit: "mg",
    type: "",
    mealTiming: [],
    prescribedBy: "",
    purpose: "",
    color: "#4CAF50",
    frequency: "",
    duration: "",
    startDate: new Date(),
    times: [],
    notes: "",
    reminderEnabled: true,
    refillReminder: false,
    currentSupply: "",
    refillAt: "",
    ownerId: "self",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadMedication = async () => {
      const medications = await getMedications();
      const med = medications.find(m => m.id === id);
      if (med) {
        setForm({
          name: med.name,
          dosage: med.dosage,
          dosageUnit: med.dosageUnit || "mg",
          type: med.type || "",
          mealTiming: Array.isArray(med.mealTiming) ? med.mealTiming : (med.mealTiming ? [med.mealTiming] : []),
          prescribedBy: med.prescribedBy || "",
          purpose: med.purpose || "",
          color: med.color || "#4CAF50",
          frequency: med.frequency || "",
          duration: med.duration || "",
          startDate: new Date(med.startDate),
          times: med.times,
          notes: (med as any).notes || "",
          reminderEnabled: med.reminderEnabled,
          refillReminder: med.refillReminder,
          currentSupply: med.currentSupply.toString(),
          refillAt: med.refillAt.toString(),
          ownerId: med.ownerId || "self",
          imageUrl: med.imageUrl,
          addedBy: med.addedBy,
        });
        setSelectedFrequency(med.frequency || "");
        setSelectedDuration(med.duration || "");
      }
    };
    if (id) loadMedication();
  }, [id]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) newErrors.name = "Medication name is required";
    if (!form.dosage.trim()) newErrors.dosage = "Dosage is required";
    if (!form.frequency) newErrors.frequency = "Frequency is required";
    if (!form.duration) newErrors.duration = "Duration is required";

    if (form.refillReminder) {
      if (!form.currentSupply)
        newErrors.currentSupply = "Current supply is required";
      if (!form.refillAt)
        newErrors.refillAt = "Refill alert threshold is required";
      if (Number(form.refillAt) >= Number(form.currentSupply))
        newErrors.refillAt = "Alert must be less than current supply";
    }

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
      const updatedMed: Medication = {
        id,
        ...form,
        currentSupply: Number(form.currentSupply),
        totalSupply: Number(form.currentSupply), // Simple assumption for edit
        refillAt: Number(form.refillAt),
        startDate: form.startDate.toISOString(),
      } as Medication;

      await updateMedication(updatedMed);
      setIsSubmitting(false);
      Alert.alert("Success", "Medication updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Update error:", error);
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to update medication");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      "Are you sure you want to delete this medication? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMedication(id);
              router.back();
            } catch (error) {
              Alert.alert("Error", "Failed to delete medication");
            }
          }
        }
      ]
    );
  };

  const renderFrequencyOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[
              styles.optionCard,
              selectedFrequency === freq.label && styles.selectedOptionCard,
            ]}
            onPress={() => {
              setSelectedFrequency(freq.label);
              setForm({ ...form, frequency: freq.label, times: freq.times });
            }}
          >
            <View
              style={[
                styles.optionIcon,
                selectedFrequency === freq.label && styles.selectedOptionIcon,
              ]}
            >
              <Ionicons
                name={freq.icon}
                size={24}
                color={selectedFrequency === freq.label ? "white" : "#666"}
              />
            </View>
            <Text
              style={[
                styles.optionLabel,
                selectedFrequency === freq.label && styles.selectedOptionLabel,
              ]}
            >
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDurationOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {DURATIONS.map((dur) => (
          <TouchableOpacity
            key={dur.id}
            style={[
              styles.optionCard,
              selectedDuration === dur.label && styles.selectedOptionCard,
            ]}
            onPress={() => {
              setSelectedDuration(dur.label);
              setForm({ ...form, duration: dur.label });
            }}
          >
            <Text
              style={[
                styles.durationNumber,
                selectedDuration === dur.label && styles.selectedDurationNumber,
              ]}
            >
              {dur.value > 0 ? dur.value : "∞"}
            </Text>
            <Text
              style={[
                styles.optionLabel,
                selectedDuration === dur.label && styles.selectedOptionLabel,
              ]}
            >
              {dur.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#065F46", "#064E3B"]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Medication</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.name && styles.inputError]}
                placeholder="Medication Name"
                placeholderTextColor="#999"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />
            </View>

            {/* Dosage Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.dosage && styles.inputError]}
                placeholder="Dosage (e.g., 500)"
                placeholderTextColor="#999"
                value={form.dosage}
                onChangeText={(text) => setForm({ ...form, dosage: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Dosage Unit */}
            <Text style={styles.unitLabel}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroller}>
              {DOSAGE_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.unitChip, form.dosageUnit === unit && styles.unitChipActive]}
                  onPress={() => setForm({ ...form, dosageUnit: unit })}
                >
                  <Text style={[styles.unitChipText, form.dosageUnit === unit && styles.unitChipTextActive]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Medication Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="medkit-outline" size={18} color="#0F766E" />{" "}Medication Type
            </Text>
            <View style={styles.typeGrid}>
              {MEDICATION_TYPES.map((medType) => (
                <TouchableOpacity
                  key={medType.id}
                  style={[styles.typeChip, form.type === medType.label && styles.typeChipActive]}
                  onPress={() => setForm({ ...form, type: medType.label })}
                >
                  <View style={[styles.typeIconContainer, form.type === medType.label && styles.typeIconContainerActive]}>
                    <Ionicons name={medType.icon} size={20} color={form.type === medType.label ? "white" : "#0F766E"} />
                  </View>
                  <Text style={[styles.typeChipLabel, form.type === medType.label && styles.typeChipLabelActive]}>
                    {medType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medicine Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="color-palette-outline" size={18} color="#0F766E" />{" "}Medicine Color
            </Text>
            <View style={styles.colorGrid}>
              {MEDICINE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorCircle, { backgroundColor: color }, form.color === color && styles.colorCircleActive]}
                  onPress={() => setForm({ ...form, color })}
                >
                  {form.color === color && <Ionicons name="checkmark" size={20} color="white" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Timing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="restaurant-outline" size={18} color="#0F766E" />{" "}When to Take
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTimingScroller}>
              {MEAL_TIMINGS.map((timing) => (
                <TouchableOpacity
                  key={timing.id}
                  style={[styles.mealChip, form.mealTiming.includes(timing.label) && styles.mealChipActive]}
                  onPress={() => {
                    const newTimings = form.mealTiming.includes(timing.label)
                      ? form.mealTiming.filter(t => t !== timing.label)
                      : [...form.mealTiming, timing.label];
                    setForm({ ...form, mealTiming: newTimings });
                  }}
                >
                  <View style={[styles.mealChipIcon, form.mealTiming.includes(timing.label) && styles.mealChipIconActive]}>
                    <Ionicons name={timing.icon} size={20} color={form.mealTiming.includes(timing.label) ? "white" : "#0F766E"} />
                  </View>
                  <Text style={[styles.mealChipText, form.mealTiming.includes(timing.label) && styles.mealChipTextActive]}>
                    {timing.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How often?</Text>
            {renderFrequencyOptions()}

            <Text style={styles.sectionTitle}>For how long?</Text>
            {renderDurationOptions()}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar" size={20} color="#0F766E" />
              </View>
              <Text style={styles.dateButtonText}>
                Starts {form.startDate.toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.startDate}
                mode="date"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setForm({ ...form, startDate: date });
                }}
              />
            )}

            {form.frequency && form.frequency !== "As needed" && (
              <View style={styles.timesContainer}>
                <Text style={styles.timesTitle}>Reminder Schedule</Text>
                {form.times.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.timeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <View style={styles.timeIconContainer}>
                      <Ionicons name="time-outline" size={20} color="#0F766E" />
                    </View>
                    <Text style={styles.timeButtonText}>{time}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [hours, minutes] = form.times[0].split(":").map(Number);
                  const date = new Date();
                  date.setHours(hours, minutes, 0, 0);
                  return date;
                })()}
                mode="time"
                onChange={(event, date) => {
                  setShowTimePicker(false);
                  if (date) {
                    const newTime = date.toLocaleTimeString("default", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    });
                    setForm((prev) => ({
                      ...prev,
                      times: prev.times.map((t, i) => (i === 0 ? newTime : t)),
                    }));
                  }
                }}
              />
            )}
          </View>

          {/* Refill Tracking */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="reload" size={20} color="#0F766E" />
                  </View>
                  <View>
                    <Text style={styles.switchLabel}>Refill Tracking</Text>
                    <Text style={styles.switchSubLabel}>
                      Get notified when you need to refill
                    </Text>
                  </View>
                </View>
                <Switch
                  value={form.refillReminder}
                  onValueChange={(value) =>
                    setForm({ ...form, refillReminder: value })
                  }
                  trackColor={{ false: "#ddd", true: "#0F766E" }}
                  thumbColor="white"
                />
              </View>
              {form.refillReminder && (
                <View style={styles.refillInputs}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Current Supply"
                        value={form.currentSupply}
                        onChangeText={(text) =>
                          setForm({ ...form, currentSupply: text })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Alert at"
                        value={form.refillAt}
                        onChangeText={(text) =>
                          setForm({ ...form, refillAt: text })
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="medical-outline" size={18} color="#0F766E" />{" "}Additional Details
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                placeholder="Prescribed By (Doctor's Name)"
                placeholderTextColor="#999"
                value={form.prescribedBy}
                onChangeText={(text) => setForm({ ...form, prescribedBy: text })}
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                placeholder="Purpose (e.g., Blood Pressure, Diabetes)"
                placeholderTextColor="#999"
                value={form.purpose}
                onChangeText={(text) => setForm({ ...form, purpose: text })}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Add notes or special instructions..."
                placeholderTextColor="#999"
                value={form.notes}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={{height: 100}} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={["#0F766E", "#047857"]}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isSubmitting}
          >
            <Ionicons name="trash-outline" size={20} color="#E91E63" style={{marginRight: 6}} />
            <Text style={styles.deleteButtonText}>Delete Medication</Text>
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
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: { width: (width - 60) / 2, backgroundColor: "white", borderRadius: 16, padding: 15, margin: 5, alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  selectedOptionCard: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  optionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  selectedOptionIcon: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  selectedOptionLabel: { color: "white" },
  durationNumber: { fontSize: 24, fontWeight: "700", color: "#0F766E", marginBottom: 5 },
  selectedDurationNumber: { color: "white" },
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
  textArea: { padding: 15, fontSize: 16, color: "#333", height: 100 },
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
  // New styles
  unitLabel: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 8, marginTop: 4 },
  unitScroller: { marginBottom: 8 },
  unitChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "white", marginRight: 8, borderWidth: 1, borderColor: "#e0e0e0" },
  unitChipActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  unitChipText: { fontSize: 14, fontWeight: "600", color: "#666" },
  unitChipTextActive: { color: "white" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeChip: { width: (width - 70) / 4, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: "white", borderWidth: 1, borderColor: "#e0e0e0" },
  typeChipActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  typeIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  typeIconContainerActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  typeChipLabel: { fontSize: 11, fontWeight: "600", color: "#333", textAlign: "center" },
  typeChipLabelActive: { color: "white" },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  colorCircleActive: { borderWidth: 3, borderColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  mealTimingScroller: { flexDirection: "row" },
  mealChip: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: "white", marginRight: 10, borderWidth: 1, borderColor: "#e0e0e0", minWidth: 100 },
  mealChipActive: { backgroundColor: "#0F766E", borderColor: "#0F766E" },
  mealChipIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#D1FAE5", justifyContent: "center", alignItems: "center", marginBottom: 6 },
  mealChipIconActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  mealChipText: { fontSize: 12, fontWeight: "600", color: "#333", textAlign: "center" },
  mealChipTextActive: { color: "white" },
});
