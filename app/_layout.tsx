import React from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "white" },
          animation: "slide_from_right",
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
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false,
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
          name="medications/add"
          options={{
            headerShown: false,
            title: "",
          }}
        />
        <Stack.Screen
          name="medications/edit"
          options={{
            headerShown: false,
            title: "",
          }}
        />
        <Stack.Screen
          name="refills"
          options={{
            headerShown: false,
            title: "",
          }}
        />
        <Stack.Screen
          name="caregiver/activity"
          options={{
            headerShown: false,
            title: "",
          }}
        />
        <Stack.Screen
          name="history"
          options={{
            headerShown: false,
            title: "",
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </>
  );
}
