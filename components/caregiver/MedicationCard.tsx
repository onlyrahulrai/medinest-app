import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MedicationCardProps {
  name: string;
  dosage: string;
  patientName: string;
  category?: string;
  status: "taken" | "pending" | "missed";
  onConfirm?: () => void;
  onEdit?: () => void;
  index?: number;
}

export default function MedicationCard({
  name,
  dosage,
  patientName,
  category,
  status,
  onConfirm,
  onEdit,
  index = 0,
}: MedicationCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="medical"
          size={22}
          color={status === "taken" ? "#4CAF50" : status === "missed" ? "#E91E63" : "#1a8e2d"}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {name} <Text style={styles.dosage}>{dosage}</Text>
        </Text>
        <Text style={styles.patient}>
          For: {patientName}
          {category ? ` • ${category}` : ""}
        </Text>
      </View>
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={18} color="#666" />
          </TouchableOpacity>
        )}
        {status === "taken" ? (
          <View style={styles.takenBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            <Text style={styles.takenText}>Taken</Text>
          </View>
        ) : status === "missed" ? (
          <View style={styles.missedBadge}>
            <Ionicons name="close-circle" size={18} color="#E91E63" />
            <Text style={styles.missedText}>Missed</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onConfirm}
            activeOpacity={0.7}
          >
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  dosage: {
    fontWeight: "400",
    color: "#666",
    fontSize: 13,
  },
  patient: {
    fontSize: 12,
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  takenText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  missedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  missedText: {
    color: "#E91E63",
    fontSize: 12,
    fontWeight: "600",
  },
  confirmBtn: {
    backgroundColor: "#1a8e2d",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  confirmText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
});
