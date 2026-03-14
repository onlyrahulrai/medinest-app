import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MedicationCard from "./MedicationCard";

export interface ScheduleMedication {
  id: string;
  name: string;
  dosage: string;
  patientName: string;
  category?: string;
  status: "taken" | "pending" | "missed";
}

interface TimeSlot {
  label: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  medications: ScheduleMedication[];
}

interface ScheduleTimelineProps {
  timeSlots: TimeSlot[];
  onConfirm?: (medId: string) => void;
  onEdit?: (medId: string) => void;
}

export default function ScheduleTimeline({
  timeSlots,
  onConfirm,
  onEdit,
}: ScheduleTimelineProps) {
  return (
    <View style={styles.container}>
      {timeSlots.map((slot, index) => (
        <View key={index} style={styles.timeSlot}>
          {/* Time header */}
          <View style={styles.timeHeader}>
            <View style={styles.timeIconContainer}>
              <Ionicons name={slot.icon} size={18} color="#1a8e2d" />
            </View>
            <Text style={styles.timeLabel}>{slot.label}</Text>
            <Text style={styles.timeValue}>{slot.time}</Text>
          </View>

          {/* Meds List */}
          {slot.medications.length > 0 ? (
            <View style={styles.medsContainer}>
              <View style={styles.medsContent}>
                {slot.medications.map((med) => (
                  <MedicationCard
                    key={med.id}
                    name={med.name}
                    dosage={med.dosage}
                    patientName={med.patientName}
                    category={med.category}
                    status={med.status}
                    onConfirm={
                      med.status === "pending" && onConfirm
                        ? () => onConfirm(med.id)
                        : undefined
                    }
                    onEdit={onEdit ? () => onEdit(med.id) : undefined}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptySlot}>
              <Ionicons name="moon-outline" size={20} color="#ccc" />
              <Text style={styles.emptyText}>
                No medications scheduled for this {slot.label.toLowerCase()}.
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  timeSlot: {
    marginBottom: 20,
  },
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#999",
  },
  medsContainer: {
    paddingLeft: 4,
    marginTop: 8,
  },
  medsContent: {
    flex: 1,
  },
  emptySlot: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
});
