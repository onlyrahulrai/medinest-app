import React from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "white" },
          animation: "slide_from_right",
          header: () => null,
          navigationBarHidden: true,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />

        <Stack.Screen
          name="medications/add"
          options={{
            headerShown: false,
            headerBackTitle: "",
            title: "",
          }}
        />
        <Stack.Screen
          name="refills"
          options={{
            headerShown: false,
            headerBackTitle: "",
            title: "",
          }}
        />
        <Stack.Screen
          name="calendar"
          options={{
            headerShown: false,
            headerBackTitle: "",
            title: "",
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            headerShown: false,
            headerBackTitle: "",
            title: "",
          }}
        />
        <Stack.Screen
          name="profile/index"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="profile/edit"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="(onboarding)"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="medications/edit"
          options={{
            headerShown: false,
            headerBackTitle: "",
            title: "",
          }}
        />
        <Stack.Screen
          name="caregiver/index"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}
