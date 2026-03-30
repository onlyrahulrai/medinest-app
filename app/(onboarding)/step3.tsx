import React, { useState, useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import {
  createOnboardingPayload,
  validateCaregiverPhone,
} from "../../utils/onboardingHelpers";
import "../../utils/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useCaregiverValidation } from "../../hooks/useCaregiverValidation";

export default function Step3Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useSelector((state: any) => state.auth.user);
  const { editUserProfile } = useAuth();

  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const RELATION_OPTIONS = [
    { label: t("onboarding.step3.form.relations.father"), value: "Father" },
    { label: t("onboarding.step3.form.relations.mother"), value: "Mother" },
    { label: t("onboarding.step3.form.relations.brother"), value: "Brother" },
    { label: t("onboarding.step3.form.relations.sister"), value: "Sister" },
    { label: t("onboarding.step3.form.relations.spouse"), value: "Spouse" },
    { label: t("onboarding.step3.form.relations.friend"), value: "Friend" },
    { label: t("onboarding.step3.form.relations.other"), value: "Other" },
  ];

  const {
    phoneError,
    lookupStatus,
    isLookingUp,
    validateAndLookup,
  } = useCaregiverValidation();



  const handleNext = async () => {
    // Allow skipping caregiver info, but validate if provided
    if (emergencyPhone.trim().length > 0 && phoneError) {
      Alert.alert(
        "Invalid Phone",
        "Please fix the phone number or clear it to skip",
      );
      return;
    }

    setIsSaving(true);

    try {
      // Build payload for step 3
      const payload = createOnboardingPayload(3, {
        caregivers:
          emergencyName || emergencyPhone
            ? [
              {
                name: emergencyName.trim(),
                phone: emergencyPhone.trim(),
                relation: emergencyRelation.trim(),
              },
            ]
            : [],
      });

      console.log("Onboarding Step 3 payload:", payload);

      // Save to backend
      const result = await editUserProfile(payload);

      if (result?.message) {
        Alert.alert(
          "Error",
          result.message || "Failed to save. Please try again.",
        );
        return;
      }

      router.push({
        pathname: "/(onboarding)/step4" as any,
      });
    } catch (error) {
      console.error("Step 3 error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasCaregiverData =
    emergencyName.trim().length > 0 || emergencyPhone.trim().length > 0;
  const hasPhoneError =
    emergencyPhone.trim().length > 0 && phoneError.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(onboarding)/step2")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("onboarding.step3.title")}</Text>
        <Text style={styles.subtitle}>{t("onboarding.step3.subtitle")}</Text>

        <View style={styles.encouragementCard}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.encouragementText}>
            {t("onboarding.step3.encouragement")}
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionDivider}>
            {t("onboarding.step3.form.title")}
          </Text>

          <Text style={styles.label}>{t("onboarding.step3.form.name")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. Jane Doe"
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholderTextColor="#999"
            />
          </View>

          <Text style={styles.label}>{t("onboarding.step3.form.phone")}</Text>
          <View
            style={[
              styles.inputContainer,
              phoneError ? styles.inputContainerError : null,
              lookupStatus === "found" ? styles.inputContainerSuccess : null,
              lookupStatus === "not-found"
                ? styles.inputContainerWarning
                : null,
            ]}
          >
            <Ionicons
              name="call-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="e.g. 9876543211"
              value={emergencyPhone}
              onChangeText={(text) => validateAndLookup(text, setEmergencyPhone)}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#999"
            />
            {isLookingUp && <ActivityIndicator size="small" color="#4CAF50" />}
            {lookupStatus === "found" && !isLookingUp && (
              <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
            )}
            {lookupStatus === "not-found" && !isLookingUp && (
              <Ionicons name="alert-circle" size={22} color="#F9A825" />
            )}
          </View>

          {/* Phone validation error */}
          {phoneError ? (
            <View style={styles.feedbackRow}>
              <Ionicons name="close-circle" size={16} color="#D32F2F" />
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}

          {/* Caregiver found */}
          {lookupStatus === "found" && !isLookingUp ? (
            <View style={styles.feedbackRow}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.successText}>
                {t("onboarding.step3.validation.found")}
              </Text>
            </View>
          ) : null}

          {/* Caregiver not found — show warning + invite */}
          {lookupStatus === "not-found" && !isLookingUp ? (
            <View style={styles.notFoundCard}>
              <View style={styles.feedbackRow}>
                <Ionicons name="alert-circle" size={16} color="#F57F17" />
                <Text style={styles.warningText}>
                  {t("onboarding.step3.validation.notFound")}
                </Text>
              </View>
              <Text style={styles.notFoundHint}>
                {t("onboarding.step3.validation.notFoundHint")}
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>
            {t("onboarding.step3.form.relation")}
          </Text>
          <TouchableOpacity
            style={styles.inputContainer}
            onPress={() => setShowRelationModal(true)}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <View style={styles.input}>
              <Text
                style={[
                  styles.relationTextValue,
                  !emergencyRelation && styles.dobPlaceholder,
                ]}
              >
                {emergencyRelation || "Select Relation"}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showRelationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRelationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRelationModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Relation</Text>
              <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.relationsList}>
              {RELATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.relationOption,
                    emergencyRelation === option.value &&
                      styles.relationOptionActive,
                  ]}
                  onPress={() => {
                    setEmergencyRelation(option.value);
                    setShowRelationModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.relationOptionText,
                      emergencyRelation === option.value &&
                        styles.relationOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {emergencyRelation === option.value && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            hasPhoneError && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={hasPhoneError || isLookingUp || isSaving}
        >
          <LinearGradient
            colors={["#4CAF50", "#2E7D32"]}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {hasCaregiverData ? t("common.next") : t("onboarding.step3.skip")}
            </Text>

            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons
                name={hasCaregiverData ? "arrow-forward" : "play-skip-forward"}
                size={20}
                color="white"
              />
            )}
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
    marginBottom: 24,
    lineHeight: 24,
  },
  encouragementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  encouragementText: {
    flex: 1,
    fontSize: 14,
    color: "#2E7D32",
    lineHeight: 20,
    fontWeight: "500",
  },
  formSection: {
    gap: 16,
  },
  sectionDivider: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputContainerError: {
    borderColor: "#D32F2F",
    borderWidth: 1.5,
  },
  inputContainerSuccess: {
    borderColor: "#4CAF50",
    borderWidth: 1.5,
  },
  inputContainerWarning: {
    borderColor: "#F9A825",
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  dobPlaceholder: {
    color: "#999",
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 13,
    color: "#D32F2F",
  },
  successText: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "500",
  },
  warningText: {
    fontSize: 13,
    color: "#F57F17",
    fontWeight: "500",
  },
  notFoundCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  notFoundHint: {
    fontSize: 12,
    color: "#795548",
    marginTop: 6,
    lineHeight: 18,
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
  relationTextValue: {
    fontSize: 16,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  relationsList: {
    marginBottom: 20,
  },
  relationOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  relationOptionActive: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  relationOptionText: {
    fontSize: 16,
    color: "#333",
  },
  relationOptionTextActive: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
});
