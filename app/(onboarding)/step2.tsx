import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { fetchCurrentUserProfile } from "../../services/api/profile";
import {
  updateOnboardingProfile,
  buildOnboardingPayload,
} from "../../utils/onboardingHelpers";
import { updateOnboarding } from "../../reducers";
import "../../utils/i18n";

const PREDEFINED_CONDITIONS = [
  "Diabetes",
  "Blood Pressure",
  "Thyroid",
  "Heart Disease",
  "Asthma",
  "Arthritis",
  "None",
];

export default function Step2Screen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  // Params from Step 1
  const [name, setName] = useState((params.name as string) || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    (params.dateOfBirth as string) || "",
  );
  const [gender, setGender] = useState((params.gender as string) || "");
  const [weight, setWeight] = useState((params.weight as string) || "");
  const [phoneNumber, setPhoneNumber] = useState(
    (params.phoneNumber as string) || "",
  );

  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill from saved profile if resuming onboarding
  useEffect(() => {
    if (!name && !dateOfBirth) {
      fetchCurrentUserProfile()
        .then((profile: any) => {
          if (profile?.name) setName(profile.name);
          const dob = profile?.profile?.dateOfBirth || profile?.dateOfBirth;
          if (dob) setDateOfBirth(new Date(dob).toISOString());
          const g = profile?.profile?.gender || profile?.gender;
          if (g) setGender(g);
          const w = profile?.profile?.weight ?? profile?.weight;
          if (w != null) setWeight(String(w));
          if (profile?.phone) setPhoneNumber(profile.phone);
          const conds = profile?.profile?.conditions || profile?.conditions;
          if (conds?.length) setSelectedConditions(conds);
        })
        .catch((err) => console.error("Failed to prefill Step 2:", err));
    }
  }, [name, dateOfBirth]);

  const toggleCondition = (condition: string) => {
    if (condition === "None") {
      setSelectedConditions(["None"]);
      return;
    }

    setSelectedConditions((prev) => {
      const current = prev.filter((c) => c !== "None");
      if (current.includes(condition)) {
        return current.filter((c) => c !== condition);
      } else {
        return [...current, condition];
      }
    });
  };

  const handleNext = async () => {
    if (selectedConditions.length === 0) {
      Alert.alert("Required", "Please select at least one condition");
      return;
    }

    setIsSaving(true);

    try {
      // Build payload for step 2
      // IMPORTANT: Do NOT send languages here - buildOnboardingPayload(2) doesn't include it
      // This prevents accidentally overwriting the user's language preference
      const payload = buildOnboardingPayload(2, {
        conditions: selectedConditions,
      });

      console.log("Onboarding Step 2 payload:", payload);

      // Save to backend
      const result = await updateOnboardingProfile(payload);

      if (!result.success) {
        Alert.alert(
          "Error",
          result.error || "Failed to save. Please try again.",
        );
        return;
      }

      // Update Redux
      dispatch(updateOnboarding({ completed: false, step: 3 }));

      router.push({
        pathname: "/(onboarding)/step3" as any,
        params: {
          name,
          dateOfBirth,
          gender,
          weight,
          phoneNumber,
          otherCondition: otherCondition.trim(),
          conditions: JSON.stringify(selectedConditions),
        },
      });
    } catch (error) {
      console.error("Step 2 error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isNextDisabled = selectedConditions.length === 0 || isSaving;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("onboarding.step2.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.step2.subtitle")}</Text>

        <View style={styles.conditionsGrid}>
          {PREDEFINED_CONDITIONS.map((condition) => {
            const isSelected = selectedConditions.includes(condition);
            return (
              <TouchableOpacity
                key={condition}
                style={[
                  styles.conditionChip,
                  isSelected && styles.conditionChipActive,
                ]}
                onPress={() => toggleCondition(condition)}
              >
                <Text
                  style={[
                    styles.conditionText,
                    isSelected && styles.conditionTextActive,
                  ]}
                >
                  {condition}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View>
          <Text style={styles.label}>{t("onboarding.step2.other")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("onboarding.step2.placeholder")}
            value={otherCondition}
            onChangeText={setOtherCondition}
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            isNextDisabled && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={isNextDisabled}
        >
          <LinearGradient
            colors={
              isNextDisabled ? ["#e0e0e0", "#e0e0e0"] : ["#4CAF50", "#2E7D32"]
            }
            style={styles.nextButtonGradient}
          >
            <Text
              style={[
                styles.nextButtonText,
                isNextDisabled && styles.nextButtonTextDisabled,
              ]}
            >
              {t("common.next")}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={isNextDisabled ? "#999" : "white"}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  progressDotActive: {
    width: 24,
    backgroundColor: "#4CAF50",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    lineHeight: 24,
  },
  conditionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  conditionChipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  conditionText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  conditionTextActive: {
    color: "#4CAF50",
    fontWeight: "700",
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "white",
  },
  nextButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    overflow: "hidden",
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonTextDisabled: {
    color: "#999",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
});
