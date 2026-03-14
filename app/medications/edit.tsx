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
    color: string;
    imageUrl?: string;
    addedBy?: 'patient' | 'caregiver';
  }>({
    name: "",
    dosage: "",
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
    color: "#1a8e2d",
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
          color: med.color,
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
        colors={["#1a8e2d", "#146922"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Medication</Text>
        </View>

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
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.dosage && styles.inputError]}
                placeholder="Dosage (e.g., 500mg)"
                placeholderTextColor="#999"
                value={form.dosage}
                onChangeText={(text) => setForm({ ...form, dosage: text })}
              />
            </View>
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
                <Ionicons name="calendar" size={20} color="#1a8e2d" />
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
                      <Ionicons name="time-outline" size={20} color="#1a8e2d" />
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
                    <Ionicons name="reload" size={20} color="#1a8e2d" />
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
                  trackColor={{ false: "#ddd", true: "#1a8e2d" }}
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
              colors={["#1a8e2d", "#146922"]}
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
  headerGradient: { position: "absolute", top: 0, left: 0, right: 0, height: Platform.OS === "ios" ? 140 : 120 },
  content: { flex: 1, paddingTop: Platform.OS === "ios" ? 50 : 30 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 20, zIndex: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "white", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "white", marginLeft: 15 },
  formContainer: { flex: 1 },
  formContentContainer: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 15, marginTop: 10 },
  mainInput: { fontSize: 20, color: "#333", padding: 15 },
  inputError: { borderColor: "#E91E63", borderWidth: 1 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: { width: (width - 60) / 2, backgroundColor: "white", borderRadius: 16, padding: 15, margin: 5, alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  selectedOptionCard: { backgroundColor: "#1a8e2d", borderColor: "#1a8e2d" },
  optionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#f5f5f5", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  selectedOptionIcon: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#333", textAlign: "center" },
  selectedOptionLabel: { color: "white" },
  durationNumber: { fontSize: 24, fontWeight: "700", color: "#1a8e2d", marginBottom: 5 },
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
  refillInputs: { marginTop: 10 }
});
