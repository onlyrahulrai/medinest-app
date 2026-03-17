import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface FamilyMember {
  id: string;
  name: string;
  image?: string;
  isOnline?: boolean;
  statusText?: string;
  nextMedication?: string;
}

interface FamilyAvatarListProps {
  members: FamilyMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAddMember?: () => void;
  onAddMedication?: (id: string) => void;
  onViewActivity?: (id: string) => void;
}

export default function FamilyAvatarList({
  members,
  selectedId,
  onSelect,
  onAddMember,
  onAddMedication,
  onViewActivity,
}: FamilyAvatarListProps) {
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <View style={styles.grid}>
      {members.map((member) => {
        const isSelected = member.id === selectedId;
        return (
          <TouchableOpacity
            key={member.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(member.id)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={styles.avatarContainer}>
                {member.image ? (
                  <Image source={{ uri: member.image }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.initials}>
                      {getInitials(member.name)}
                    </Text>
                  </View>
                )}
                {member.isOnline && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.name} numberOfLines={1}>{member.name}</Text>
                <Text style={[styles.statusText, member.statusText === "Needs Attention" ? styles.statusWarning : styles.statusGood]}>
                  {member.statusText || "On Track"}
                </Text>
              </View>
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.addMedicationButton}
                  onPress={() => onAddMedication && onAddMedication(member.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add-circle" size={28} color="#059669" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewActivityButton}
                  onPress={() => onViewActivity && onViewActivity(member.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="stats-chart" size={24} color="#6366F1" />
                </TouchableOpacity>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
            </View>
            
            {(member.nextMedication || isSelected) && (
              <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={14} color="#666" />
                <Text style={styles.footerText}>Next: {member.nextMedication || "No more today"}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#1a8e2d",
    backgroundColor: "#fcfdfe",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "white",
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  statusGood: {
    color: "#1a8e2d",
  },
  statusWarning: {
    color: "#E91E63",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#1a8e2d",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1a8e2d",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addMedicationButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  viewActivityButton: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  footerText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    fontWeight: "500",
  },
});
