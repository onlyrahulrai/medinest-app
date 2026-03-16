import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F766E",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="caregiver"
        options={{
          title: "Caregiver",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "white",
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    height: Platform.OS === "ios" ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  activeIconBg: {
    backgroundColor: "#D1FAE5",
  },
});
