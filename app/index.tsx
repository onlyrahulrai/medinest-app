import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import * as Network from "expo-network";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authStorage } from "@/utils/authStorage";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getOnboardingRoute } from "@/utils/onboardingHelpers";

function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const { getUserProfile } = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();

  const getNetworkState = async () => {
    try {
      const info = await Network.getNetworkStateAsync();

      return info;
    } catch (error) {
      return {
        isConnected: false,
        type: "unknown",
        isInternetReachable: false,
      };
    }
  };

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

    // Simulate loading time (e.g., checking auth status) and fetching network info
    (async () => {
      const networkInfo = await getNetworkState();

      // Dispatch network info to Redux
      dispatch({ type: "network/setNetworkInfo", payload: networkInfo });

      const hasRunBefore = await AsyncStorage.getItem("has_run_before_v1");

      if (!hasRunBefore) {
        // Fresh install detected: Wipe iOS Keychain to prevent ghost sessions
        await authStorage.deleteToken();

        await AsyncStorage.setItem("has_run_before_v1", "true");

        await AsyncStorage.setItem("language", "en"); // Set default language

        router.replace("/(onboarding)/language");

        return;
      }

      // Simulate a delay for loading (e.g., 2 seconds)
      if (networkInfo.isInternetReachable) {
        const { data, success }: any = await getUserProfile();

        if (success) {
          dispatch({ type: "auth/loaded", payload: data });

          // Navigate to correct screen based on onboarding status
          if (data.onboarding.completed) {
            router.replace("/(tabs)");
          } else {
            // Navigate to the specific onboarding step
            const route = getOnboardingRoute(data.onboarding.step);

            router.replace(route);
          }
        } else {
          router.replace("/login");
        }
      } else {
        // No internet: Navigate to a screen that can work offline or show an error
        console.log("No internet connection. Navigating to offline screen.");
      }
    })();
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

export default SplashScreen;

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
