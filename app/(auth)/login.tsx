import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PhoneInput } from "../../components/auth/PhoneInput";
import { Button } from "../../components/auth/Button";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const { requestOTP, isLoading, error } = useAuth();
  const router = useRouter();

  const handleSendOTP = async () => {
    Keyboard.dismiss();

    setPhoneError(undefined);

    // Quick validation
    if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, "").length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number");
      return;
    }

    const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");

    const result: Record<string, any> = await requestOTP(cleanNumber);

    if (result.success) {
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phoneNumber: cleanNumber },
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="medical" size={48} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Welcome to MedRemind</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to get started
            </Text>
          </View>

          <View style={styles.formContainer}>
            <PhoneInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              error={phoneError || error || undefined}
              placeholder="000 000 0000"
              autoFocus
            />

            <Button
              title="Continue"
              onPress={handleSendOTP}
              isLoading={isLoading}
              style={{ marginTop: 8 }}
            />

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  termsText: {
    fontSize: 12,
    color: "#9e9e9e",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
});
