import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { authStorage } from "../utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchCurrentUserProfile } from "../services/api/profile";
import { ApiError } from "../services/api/client";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      try {
        const hasRunBefore = await AsyncStorage.getItem("has_run_before_v1");
        if (!hasRunBefore) {
          // Fresh install detected: Wipe iOS Keychain to prevent ghost sessions
          await authStorage.deleteToken();
          await AsyncStorage.setItem("has_run_before_v1", "true");
          router.replace("/(onboarding)/language");
          return;
        }

        const token = await authStorage.getToken();
        if (token) {
          try {
            // Token found — validate by calling user details API
            const profile = await fetchCurrentUserProfile();
            if (profile?.isOnboardingCompleted) {
              router.replace("/(tabs)");
            } else {
              const step = profile?.onboardingStep ?? 1;
              const route = step <= 1 ? "/(onboarding)/step1" : `/(onboarding)/step${step}`;
              router.replace(route as any);
            }
          } catch (e) {
            // Token is invalid/expired (401) — clear it and go to login
            if (e instanceof ApiError && e.status === 401) {
              await authStorage.deleteToken();
              router.replace("/(auth)/login");
            } else {
              // Network or other error — go to login as safe fallback
              router.replace("/(auth)/login");
            }
          }
        } else {
          router.replace("/(onboarding)/language");
        }
      } catch (e) {
        router.replace("/(onboarding)/language");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons name="medical" size={100} color="#4CAF50" />
        <Text style={styles.appName}>MedRemind</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
  },
  appName: {
    color: "#4CAF50",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    letterSpacing: 1,
  },
});
