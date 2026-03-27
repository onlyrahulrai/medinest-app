import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useRootNavigationState } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { authStorage } from "../utils/authStorage";
import { authService } from "../services/api/auth";
import { setSessionRestoring, loaded } from "../reducers";
import {
  selectIsSessionRestoring,
  selectIsAuthenticated,
  selectIsOnboardingCompleted,
} from "../reducers/selectors";

export default function RootNavigator() {
  const dispatch = useDispatch();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isSessionRestoring = useSelector(selectIsSessionRestoring);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isOnboardingCompleted = useSelector(selectIsOnboardingCompleted);

  type OnboardingRoute =
    | "./(onboarding)/step1"
    | "./(onboarding)/step2"
    | "./(onboarding)/step3"
    | "./(onboarding)/step4"
    | "./(onboarding)/step5";

  const getOnboardingRoute = (step: number): OnboardingRoute => {
    const routes: any = {
      1: "/(onboarding)/step1",
      2: "/(onboarding)/step2",
      3: "/(onboarding)/step3",
      4: "/(onboarding)/step4",
      5: "/(onboarding)/step5",
    };

    return routes[Math.min(step + 1, 5) || routes[1]];
  };

  // Session restoration on app launch - wait for router to be ready
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const restoreSession = async () => {
      console.log("Starting session restoration...");

      try {
        const token = await authStorage.getToken();

        if (!token) {
            // No token, not authenticated
            dispatch(setSessionRestoring(false));
            return;
        }

        // Token exists, fetch user profile to restore session
        try {
          const result = await authService.getProfile();

          dispatch(
            loaded({
              user: result,
              access: token,
              onboarding: result.onboarding,
            }),
          );

          // Navigate to correct screen based on onboarding status
          if (result.onboarding.completed) {
            router.replace("/(tabs)");
          } else {
            // Navigate to the specific onboarding step
            const route = getOnboardingRoute(result.onboarding.step);

            router.replace(route);
          }
        } catch (profileError) {
          // Token exists but can't fetch profile (maybe token expired)
          // Clear token and let user login again
          await authStorage.deleteToken();
          dispatch(setSessionRestoring(false));
          console.error("Failed to restore profile:", profileError);
        }
      } catch (error) {
        console.error("Session restoration error:", error);
        dispatch(setSessionRestoring(false));
      }
    };

    restoreSession();
  }, [dispatch, router, rootNavigationState?.key]);

  // Show loading screen while restoring session
  if (isSessionRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // Navigation is handled by the root layout - this component only manages session state
  return null;
}
