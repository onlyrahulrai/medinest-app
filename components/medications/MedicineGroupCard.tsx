import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedicineGroupSummary } from "../../services/api/medicineGroups";
import {
  getMedicationThemeForGroup,
  isSelfCreatedGroup,
  type MedicationTheme,
} from "../../constants/medicationTheme";

interface MedicineGroupCardProps {
  group: MedicineGroupSummary;
  onPress: () => void;
}

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusStyle = (
  status: MedicineGroupSummary["status"],
  theme: MedicationTheme,
  selfCreated: boolean
) => {
  switch (status) {
    case "completed":
      return selfCreated
        ? { backgroundColor: theme.lightAccent, color: theme.primary }
        : { backgroundColor: "#DBEAFE", color: "#1D4ED8" };
    case "archived":
      return { backgroundColor: "#F1F5F9", color: "#64748B" };
    default:
      return { backgroundColor: theme.lightAccent, color: theme.primary };
  }
};

export default function MedicineGroupCard({
  group,
  onPress,
}: MedicineGroupCardProps) {
  const selfCreated = isSelfCreatedGroup(group);
  const theme = getMedicationThemeForGroup(group);
  const statusStyle = getStatusStyle(group.status, theme, selfCreated);
  const title = group.name?.trim() || "Untitled Treatment Plan";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.lightAccent }]}>
          <Ionicons
            name={group.type === "multi" ? "layers-outline" : "medical-outline"}
            size={22}
            color={theme.accent}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {group.patientName ? (
            <Text style={styles.patientName} numberOfLines={1}>
              For {group.patientName}
            </Text>
          ) : null}
          <Text style={styles.subtitle}>
            {group.medicineCount} {group.medicineCount === 1 ? "medicine" : "medicines"}
            {group.duration?.forHowLong ? ` • ${group.duration.forHowLong}` : ""}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color="#64748B" />
          <Text style={styles.metaText}>Started {formatDate(group.duration?.startDate)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons
            name={group.reminderEnabled ? "notifications" : "notifications-off-outline"}
            size={14}
            color={group.reminderEnabled ? theme.accent : "#94A3B8"}
          />
          <Text style={styles.metaText}>
            {group.reminderEnabled ? "Reminders on" : "Reminders off"}
          </Text>
        </View>
      </View>

      {(group.prescribedBy || group.pharmacyName) && (
        <View style={styles.footerRow}>
          {group.prescribedBy ? (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color="#64748B" />
              <Text style={styles.metaText} numberOfLines={1}>
                {group.prescribedBy}
              </Text>
            </View>
          ) : null}
          {group.pharmacyName ? (
            <View style={styles.metaItem}>
              <Ionicons name="storefront-outline" size={14} color="#64748B" />
              <Text style={styles.metaText} numberOfLines={1}>
                {group.pharmacyName}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  footerRow: {
    marginTop: 10,
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
    flexShrink: 1,
  },
});
