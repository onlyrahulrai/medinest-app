import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MedicineGroupMedicine } from "../../services/api/medicineGroups";

interface MedicineGroupMedicineRowProps {
  medicine: MedicineGroupMedicine;
  index: number;
}

export default function MedicineGroupMedicineRow({ medicine, index }: MedicineGroupMedicineRowProps) {
  const color = medicine.meta?.color || "#059669";
  const dosageText = `${medicine.dosage?.amount ?? ""} ${medicine.dosage?.unit ?? ""}`.trim();
  const scheduleText = medicine.customSchedule?.enabled
    ? medicine.customSchedule.frequency || "Custom schedule"
    : "Routine schedule";

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{index + 1}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{medicine.name}</Text>
          {medicine.meta?.type ? (
            <View style={styles.typeChip}>
              <Text style={styles.typeChipText}>{medicine.meta.type}</Text>
            </View>
          ) : null}
        </View>

        {dosageText ? <Text style={styles.detailText}>{dosageText}</Text> : null}
        <Text style={styles.detailText}>{scheduleText}</Text>
        {medicine.purpose ? <Text style={styles.purposeText}>{medicine.purpose}</Text> : null}
        {medicine.expiryDate ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text style={styles.metaText}>
              Expires {new Date(medicine.expiryDate).toLocaleDateString()}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  badgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  typeChip: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },
  detailText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
  },
  purposeText: {
    fontSize: 13,
    color: "#334155",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#64748B",
  },
});
