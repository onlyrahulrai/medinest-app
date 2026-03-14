import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AlertAction {
  label: string;
  primary?: boolean;
  onPress?: () => void;
}

interface AlertCardProps {
  type: "missed" | "refill";
  patientName: string;
  patientImage?: string;
  alertText: string;
  timeAgo: string;
  actions: AlertAction[];
}

export default function AlertCard({
  type,
  patientName,
  patientImage,
  alertText,
  timeAgo,
  actions,
}: AlertCardProps) {
  const isMissed = type === "missed";
  const borderColor = isMissed ? "#EF4444" : "#F59E0B";
  const iconBg = isMissed ? "#FEF2F2" : "#FFFBEB";
  const iconColor = isMissed ? "#EF4444" : "#F59E0B";

  return (
    <View style={[styles.card, { backgroundColor: iconBg, borderColor: borderColor }]}>
      <View style={styles.topRow}>
        <View style={styles.patientInfo}>
          {patientImage ? (
            <Image source={{ uri: patientImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
              <Ionicons name="person" size={16} color={iconColor} />
            </View>
          )}
          <View style={styles.textContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>
            <Text style={[styles.alertText, { color: iconColor }]}>{alertText}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actionsRow}>
        {actions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.actionBtn,
              action.primary
                ? { backgroundColor: iconColor }
                : { backgroundColor: "white", borderWidth: 1, borderColor: "#e2e8f0" },
            ]}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.actionText,
                action.primary ? { color: "white" } : { color: "#475569" },
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    marginHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 11,
    color: "#64748B",
  },
  alertText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 46,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
