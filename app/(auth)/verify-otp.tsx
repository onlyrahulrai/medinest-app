import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OTPInput } from "../../components/auth/OTPInput";
import { Button } from "../../components/auth/Button";
import { useAuth } from "../../hooks/useAuth";

const RESEND_TIMER = 30;

export default function VerifyOTPScreen() {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(RESEND_TIMER);
  const router = useRouter();
  const params = useLocalSearchParams();
  const phoneNumber = (params.phoneNumber as string) || "";

  const { loginWithOtp, requestOTP, isLoading, error } = useAuth();

  // Handle countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async () => {
    Keyboard.dismiss();

    if (otp.length !== 6) {
      return; // Ensure full 6 digits
    }

    const result: any = await loginWithOtp(phoneNumber, otp);

    if (result.success) {
      const { data } = result;

      if (data?.onboarding?.completed) {
        router.replace("/(tabs)");
      } else {
        router.replace(getOnboardingRoute(data?.onboarding?.step || 0));
      }
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    const success = await requestOTP(phoneNumber);

    if (success) {
      setTimer(RESEND_TIMER);
      setOtp("");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {"\n"}
              <Text style={styles.phoneNumberText}>+91 {phoneNumber}</Text>
            </Text>
          </View>

          <View style={styles.formContainer}>
            <OTPInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                if (value.length === 6 && !isLoading) {
                  // Auto-submit when length reached
                  handleVerify();
                }
              }}
              length={6}
              error={error || undefined}
            />

            <Button
              title="Verify"
              onPress={handleVerify}
              isLoading={isLoading}
              disabled={otp.length !== 6 || isLoading}
              style={{ marginTop: 8 }}
            />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableWithoutFeedback
                onPress={handleResend}
                disabled={timer > 0 || isLoading}
              >
                <Text
                  style={[
                    styles.resendLink,
                    timer > 0 && styles.resendLinkDisabled,
                  ]}
                >
                  {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
                </Text>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

import { TouchableOpacity } from "react-native";
import { getOnboardingRoute } from "@/utils/onboardingHelpers";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  innerContainer: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginTop: Platform.OS === "ios" ? 40 : 20,
    marginBottom: 32,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  phoneNumberText: {
    fontWeight: "600",
    color: "#333",
  },
  formContainer: {
    width: "100%",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  resendText: {
    color: "#666",
    fontSize: 14,
  },
  resendLink: {
    color: "#4CAF50",
    fontWeight: "600",
    fontSize: 14,
  },
  resendLinkDisabled: {
    color: "#9e9e9e",
  },
});
