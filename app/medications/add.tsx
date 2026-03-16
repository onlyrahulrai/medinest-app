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
import { addMedication, getUserProfile, ManagedPatient, Medication } from "../../utils/storage";
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

export default function AddMedicationScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    dosageUnit: "mg",
    type: "",
    mealTiming: "",
    prescribedBy: "",
    purpose: "",
    color: "#4CAF50",
    frequency: "",
    duration: "",
    startDate: new Date(),
    times: ["09:00"],
    notes: "",
    reminderEnabled: true,
    refillReminder: false,
    currentSupply: "",
    refillAt: "",
    imageUri: "",
    ownerId: "self",
  });

  const { patientId } = useLocalSearchParams<{ patientId: string }>();
  const [managedPatients, setManagedPatients] = useState<ManagedPatient[]>([]);
  
  useEffect(() => {
    const loadPatients = async () => {
      const profile = await getUserProfile();
      setManagedPatients(profile?.managedPatients || []);
      
      // If patientId is provided in URL, set it as owner
      if (patientId) {
        setForm(prev => ({ ...prev, ownerId: patientId }));
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setForm({ ...form, imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = "Medication name is required";
    }

    if (!form.dosage.trim()) {
      newErrors.dosage = "Dosage is required";
    }

    if (!form.frequency) {
      newErrors.frequency = "Frequency is required";
    }

    if (!form.duration) {
      newErrors.duration = "Duration is required";
    }

    if (form.refillReminder) {
      if (!form.currentSupply) {
        newErrors.currentSupply =
          "Current supply is required for refill tracking";
      }
      if (!form.refillAt) {
        newErrors.refillAt = "Refill alert threshold is required";
      }
      if (Number(form.refillAt) >= Number(form.currentSupply)) {
        newErrors.refillAt = "Refill alert must be less than current supply";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      if (!validateForm()) {
        Alert.alert("Error", "Please fill in all required fields correctly");
        return;
      }

      if (isSubmitting) return;
      setIsSubmitting(true);

      const medicationData = {
        id: Math.random().toString(36).substr(2, 9),
        ...form,
        currentSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        totalSupply: form.currentSupply ? Number(form.currentSupply) : 0,
        refillAt: form.refillAt ? Number(form.refillAt) : 0,
        startDate: form.startDate.toISOString(),
        color: form.color,
        imageUrl: form.imageUri || undefined,
        addedBy: (form.ownerId === "self" ? 'patient' : 'caregiver') as 'patient' | 'caregiver',
      } as Medication;

      await addMedication(medicationData);

      // Schedule reminders if enabled
      if (medicationData.reminderEnabled) {
        await scheduleMedicationReminder(medicationData);
      }
      if (medicationData.refillReminder) {
        await scheduleRefillReminder(medicationData);
      }

      Alert.alert(
        "Success",
        "Medication added successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert(
        "Error",
        "Failed to save medication. Please try again.",
        [{ text: "OK" }],
        { cancelable: false }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFrequencySelect = (freq: string) => {
    setSelectedFrequency(freq);
    const selectedFreq = FREQUENCIES.find((f) => f.label === freq);
    setForm((prev) => ({
      ...prev,
      frequency: freq,
      times: selectedFreq?.times || [],
    }));
    if (errors.frequency) {
      setErrors((prev) => ({ ...prev, frequency: "" }));
    }
  };

  const handleDurationSelect = (dur: string) => {
    setSelectedDuration(dur);
    setForm((prev) => ({ ...prev, duration: dur }));
    if (errors.duration) {
      setErrors((prev) => ({ ...prev, duration: "" }));
    }
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
              setForm({ ...form, frequency: freq.label });
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
          <Text style={styles.headerTitle}>New Medication</Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* Patient Selection (only if caregiver has patients) */}
          {(managedPatients.length > 0 || patientId) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Who is this for?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientSelector}>
                <TouchableOpacity 
                  style={[styles.patientChip, form.ownerId === "self" && styles.patientChipActive]}
                  onPress={() => setForm({ ...form, ownerId: "self" })}
                >
                  <Text style={[styles.patientChipText, form.ownerId === "self" && styles.patientChipTextActive]}>Me</Text>
                </TouchableOpacity>
                {managedPatients.map(patient => (
                  <TouchableOpacity 
                    key={patient.id}
                    style={[styles.patientChip, form.ownerId === patient.id && styles.patientChipActive]}
                    onPress={() => setForm({ ...form, ownerId: patient.id })}
                  >
                    <Text style={[styles.patientChipText, form.ownerId === patient.id && styles.patientChipTextActive]}>
                      {patient.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Image Picker */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              {form.imageUri ? (
                <Image source={{ uri: form.imageUri }} style={styles.medicationImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#1a8e2d" />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.name && styles.inputError]}
                placeholder="Medication Name"
                placeholderTextColor="#999"
                value={form.name}
                onChangeText={(text) => {
                  setForm({ ...form, name: text });
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            {/* Dosage Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.dosage && styles.inputError]}
                placeholder="Dosage (e.g., 500)"
                placeholderTextColor="#999"
                value={form.dosage}
                onChangeText={(text) => {
                  setForm({ ...form, dosage: text });
                  if (errors.dosage) {
                    setErrors({ ...errors, dosage: "" });
                  }
                }}
                keyboardType="numeric"
              />
            </View>

            {/* Dosage Unit */}
            <Text style={styles.unitLabel}>Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroller}>
              {DOSAGE_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitChip,
                    form.dosageUnit === unit && styles.unitChipActive,
                  ]}
                  onPress={() => setForm({ ...form, dosageUnit: unit })}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      form.dosageUnit === unit && styles.unitChipTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.dosage && (
              <Text style={styles.errorText}>{errors.dosage}</Text>
            )}
          </View>

          {/* Medication Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="medkit-outline" size={18} color="#1a8e2d" />{" "}
              Medication Type
            </Text>
            <View style={styles.typeGrid}>
              {MEDICATION_TYPES.map((medType) => (
                <TouchableOpacity
                  key={medType.id}
                  style={[
                    styles.typeChip,
                    form.type === medType.label && styles.typeChipActive,
                  ]}
                  onPress={() => setForm({ ...form, type: medType.label })}
                >
                  <View
                    style={[
                      styles.typeIconContainer,
                      form.type === medType.label && styles.typeIconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name={medType.icon}
                      size={20}
                      color={form.type === medType.label ? "white" : "#1a8e2d"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeChipLabel,
                      form.type === medType.label && styles.typeChipLabelActive,
                    ]}
                  >
                    {medType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medicine Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="color-palette-outline" size={18} color="#1a8e2d" />{" "}
              Medicine Color
            </Text>
            <View style={styles.colorGrid}>
              {MEDICINE_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    form.color === color && styles.colorCircleActive,
                  ]}
                  onPress={() => setForm({ ...form, color })}
                >
                  {form.color === color && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Meal Timing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="restaurant-outline" size={18} color="#1a8e2d" />{" "}
              When to Take
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealTimingScroller}>
              {MEAL_TIMINGS.map((timing) => (
                <TouchableOpacity
                  key={timing.id}
                  style={[
                    styles.mealChip,
                    form.mealTiming === timing.label && styles.mealChipActive,
                  ]}
                  onPress={() => setForm({ ...form, mealTiming: timing.label })}
                >
                  <View
                    style={[
                      styles.mealChipIcon,
                      form.mealTiming === timing.label && styles.mealChipIconActive,
                    ]}
                  >
                    <Ionicons
                      name={timing.icon}
                      size={20}
                      color={form.mealTiming === timing.label ? "white" : "#1a8e2d"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.mealChipText,
                      form.mealTiming === timing.label && styles.mealChipTextActive,
                    ]}
                  >
                    {timing.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How often?</Text>
            {errors.frequency && (
              <Text style={styles.errorText}>{errors.frequency}</Text>
            )}
            {renderFrequencyOptions()}

            <Text style={styles.sectionTitle}>For how long?</Text>
            {errors.duration && (
              <Text style={styles.errorText}>{errors.duration}</Text>
            )}
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
                <Text style={styles.timesTitle}>Medication Times</Text>
                {form.times.map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.timeButton}
                    onPress={() => {
                      setShowTimePicker(true);
                    }}
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

          {/* Reminders */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="notifications" size={20} color="#1a8e2d" />
                  </View>
                  <View>
                    <Text style={styles.switchLabel}>Reminders</Text>
                    <Text style={styles.switchSubLabel}>
                      Get notified when it's time to take your medication
                    </Text>
                  </View>
                </View>
                <Switch
                  value={form.reminderEnabled}
                  onValueChange={(value) =>
                    setForm({ ...form, reminderEnabled: value })
                  }
                  trackColor={{ false: "#ddd", true: "#1a8e2d" }}
                  thumbColor="white"
                />
              </View>
            </View>
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
                  onValueChange={(value) => {
                    setForm({ ...form, refillReminder: value });
                    if (!value) {
                      setErrors({
                        ...errors,
                        currentSupply: "",
                        refillAt: "",
                      });
                    }
                  }}
                  trackColor={{ false: "#ddd", true: "#1a8e2d" }}
                  thumbColor="white"
                />
              </View>
              {form.refillReminder && (
                <View style={styles.refillInputs}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[
                          styles.input,
                          errors.currentSupply && styles.inputError,
                        ]}
                        placeholder="Current Supply"
                        placeholderTextColor="#999"
                        value={form.currentSupply}
                        onChangeText={(text) => {
                          setForm({ ...form, currentSupply: text });
                          if (errors.currentSupply) {
                            setErrors({ ...errors, currentSupply: "" });
                          }
                        }}
                        keyboardType="numeric"
                      />
                      {errors.currentSupply && (
                        <Text style={styles.errorText}>
                          {errors.currentSupply}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.inputContainer, styles.flex1]}>
                      <TextInput
                        style={[
                          styles.input,
                          errors.refillAt && styles.inputError,
                        ]}
                        placeholder="Alert at"
                        placeholderTextColor="#999"
                        value={form.refillAt}
                        onChangeText={(text) => {
                          setForm({ ...form, refillAt: text });
                          if (errors.refillAt) {
                            setErrors({ ...errors, refillAt: "" });
                          }
                        }}
                        keyboardType="numeric"
                      />
                      {errors.refillAt && (
                        <Text style={styles.errorText}>{errors.refillAt}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="medical-outline" size={18} color="#1a8e2d" />{" "}
              Additional Details
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                placeholder="Prescribed By (Doctor's Name)"
                placeholderTextColor="#999"
                value={form.prescribedBy}
                onChangeText={(text) =>
                  setForm({ ...form, prescribedBy: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.mainInput}
                placeholder="Purpose (e.g., Blood Pressure, Diabetes)"
                placeholderTextColor="#999"
                value={form.purpose}
                onChangeText={(text) =>
                  setForm({ ...form, purpose: text })
                }
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSubmitting && styles.saveButtonDisabled,
            ]}
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
                {isSubmitting ? "Adding..." : "Add Medication"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 140 : 120,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginLeft: 15,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 25,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  medicationImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#1a8e2d",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 15,
    marginTop: 10,
  },
  mainInput: {
    fontSize: 20,
    color: "#333",
    padding: 15,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  optionCard: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOptionCard: {
    backgroundColor: "#1a8e2d",
    borderColor: "#1a8e2d",
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedOptionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  selectedOptionLabel: {
    color: "white",
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a8e2d",
    marginBottom: 5,
  },
  selectedDurationNumber: {
    color: "white",
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  switchSubLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  textAreaContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    height: 100,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  saveButtonGradient: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#FF5252",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  refillInputs: {
    marginTop: 15,
  },
  timesContainer: {
    marginTop: 20,
  },
  timesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  timeButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  patientSelector: {
    flexDirection: "row",
    marginBottom: 10,
  },
  patientChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  patientChipActive: {
    backgroundColor: "#1a8e2d",
    borderColor: "#1a8e2d",
  },
  patientChipText: {
    color: "#666",
    fontWeight: "600",
  },
  patientChipTextActive: {
    color: "white",
  },
  // Dosage Row
  unitLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
    marginTop: 4,
  },
  unitScroller: {
    marginBottom: 8,
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  unitChipActive: {
    backgroundColor: "#1a8e2d",
    borderColor: "#1a8e2d",
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  unitChipTextActive: {
    color: "white",
  },
  // Medication Type Grid
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeChip: {
    width: (width - 70) / 4,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  typeChipActive: {
    backgroundColor: "#1a8e2d",
    borderColor: "#1a8e2d",
  },
  typeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  typeIconContainerActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  typeChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  typeChipLabelActive: {
    color: "white",
  },
  // Color Grid
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Meal Timing
  mealTimingScroller: {
    flexDirection: "row",
  },
  mealChip: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "white",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minWidth: 100,
  },
  mealChipActive: {
    backgroundColor: "#1a8e2d",
    borderColor: "#1a8e2d",
  },
  mealChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  mealChipIconActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  mealChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  mealChipTextActive: {
    color: "white",
  },
});
