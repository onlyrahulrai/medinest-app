import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { createOnboardingPayload } from "../../utils/onboardingHelpers";
import "../../utils/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useSelector } from "react-redux";

export default function Step5Screen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useSelector((state: any) => state.auth.user);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [shareActivity, setShareActivity] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { editUserProfile } = useAuth();

  // Pre-fill from saved profile if resuming onboarding
  useEffect(() => {
    setSoundEnabled(user?.preferences?.soundEnabled ?? true);
    setVibrationEnabled(user?.preferences?.vibrationEnabled ?? true);
    setShareActivity(user?.preferences?.shareActivityWithCaregiver ?? true);
  }, [user]);

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Build final onboarding payload (step 5 = completed)
      const payload = createOnboardingPayload(5, {
        soundEnabled,
        vibrationEnabled,
        shareActivityWithCaregiver: shareActivity,
      });

      console.log("Onboarding Step 5 payload:", payload);

      // Save to backend final completion
      const result = await editUserProfile(payload);

      if (result?.message) {
        Alert.alert(
          "Error",
          result?.message || "Failed to complete onboarding. Please try again.",
        );
        return;
      }

      // Navigate to home
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      Alert.alert("Oops", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(onboarding)/step4")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {t("onboarding.step4.title", "Final Settings")}
        </Text>
        <Text style={styles.subtitle}>
          {t(
            "onboarding.step4.subtitle",
            "Configure how you want to receive alerts.",
          )}
        </Text>

        <View style={styles.formSection}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="volume-high-outline"
                size={24}
                color="#4CAF50"
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>
                  {t("onboarding.step4.sound.title", "Sound Alerts")}
                </Text>
                <Text style={styles.settingDescription}>
                  {t(
                    "onboarding.step4.sound.description",
                    "Get audible reminders for medication.",
                  )}
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: "#e0e0e0", true: "#A5D6A7" }}
              thumbColor={soundEnabled ? "#4CAF50" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="phone-portrait-outline"
                size={24}
                color="#4CAF50"
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>
                  {t("onboarding.step4.vibration.title", "Vibration")}
                </Text>
                <Text style={styles.settingDescription}>
                  {t(
                    "onboarding.step4.vibration.description",
                    "Vibrate for reminder notifications.",
                  )}
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: "#e0e0e0", true: "#A5D6A7" }}
              thumbColor={vibrationEnabled ? "#4CAF50" : "#f4f3f4"}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons
                name="share-social-outline"
                size={24}
                color="#4CAF50"
                style={styles.settingIcon}
              />
              <View>
                <Text style={styles.settingTitle}>
                  {t("onboarding.step4.shareActivity.title", "Share Activity")}
                </Text>
                <Text style={styles.settingDescription}>
                  {t(
                    "onboarding.step4.shareActivity.description",
                    "Keep caregivers informed of your progress.",
                  )}
                </Text>
              </View>
            </View>
            <Switch
              value={shareActivity}
              onValueChange={setShareActivity}
              trackColor={{ false: "#e0e0e0", true: "#A5D6A7" }}
              thumbColor={shareActivity ? "#4CAF50" : "#f4f3f4"}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
          onPress={handleComplete}
          disabled={isSaving}
        >
          <LinearGradient
            colors={isSaving ? ["#e0e0e0", "#e0e0e0"] : ["#4CAF50", "#2E7D32"]}
            style={styles.nextButtonGradient}
          >
            <Text
              style={[
                styles.nextButtonText,
                isSaving && styles.nextButtonTextDisabled,
              ]}
            >
              {isSaving
                ? t("onboarding.step4.saving", "Saving...")
                : t("common.finish", "Finish Setup")}
            </Text>
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="white" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  progressDotActive: { width: 24, backgroundColor: "#4CAF50" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 40, lineHeight: 24 },
  formSection: { gap: 24 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  settingInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingIcon: { marginRight: 16 },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: { fontSize: 14, color: "#666" },
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
  nextButtonDisabled: { opacity: 0.7 },
  nextButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  nextButtonTextDisabled: { color: "#999" },
});
