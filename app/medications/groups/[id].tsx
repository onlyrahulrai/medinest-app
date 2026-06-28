import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import MedicineGroupMedicineRow from "../../../components/medications/MedicineGroupMedicineRow";
import { getMedicationThemeForGroup, MEDICATION_THEMES } from "../../../constants/medicationTheme";
import {
  getMedicineGroupById,
  type MedicineGroupDetails,
} from "../../../services/api/medicineGroups";

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function MedicineGroupDetailScreen() {
  const router = useRouter();
  const { id, patientId: patientIdParam } = useLocalSearchParams<{ id: string; patientId?: string }>();
  const patientId = Array.isArray(patientIdParam) ? patientIdParam[0] : patientIdParam;
  const [group, setGroup] = useState<MedicineGroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(
    async (isRefresh = false) => {
      if (!id) {
        setError("Medicine group not found");
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await getMedicineGroupById(id, patientId);
        setGroup(response);
      } catch (err: any) {
        const message =
          err?.response?.data?.message || err?.message || "Failed to load medicine group";
        setError(message);
        setGroup(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, patientId]
  );

  useFocusEffect(
    useCallback(() => {
      loadGroup();
    }, [loadGroup])
  );

  const handleEditGroup = () => {
    if (!group?._id) return;

    router.push({
      pathname: "/medications/edit",
      params: { groupId: group._id },
    });
  };

  const title = group?.name?.trim() || "Untitled Treatment Plan";
  const theme = group ? getMedicationThemeForGroup(group) : MEDICATION_THEMES.self;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.headerColors} style={styles.headerGradient} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Group Details
          </Text>
          <TouchableOpacity
            onPress={handleEditGroup}
            style={[styles.backButton, !group?._id && styles.disabledButton]}
            disabled={!group?._id}
          >
            <Ionicons name="create-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.stateText}>Loading group details...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to load group</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.accent }]} onPress={() => loadGroup()}>
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : group ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadGroup(true)}
                tintColor={theme.accent}
              />
            }
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={[styles.summaryIcon, { backgroundColor: theme.lightAccent }]}>
                  <Ionicons
                    name={group.type === "multi" ? "layers-outline" : "medical-outline"}
                    size={24}
                    color={theme.accent}
                  />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>{title}</Text>
                  {group.patientName ? (
                    <Text style={styles.patientName}>For {group.patientName}</Text>
                  ) : null}
                  <Text style={styles.summarySubtitle}>
                    {group.medicines.length}{" "}
                    {group.medicines.length === 1 ? "medicine" : "medicines"} in this plan
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Duration</Text>
                  <Text style={styles.infoValue}>
                    {group.duration?.forHowLong || "Not set"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Start Date</Text>
                  <Text style={styles.infoValue}>{formatDate(group.duration?.startDate)}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>
                    {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Reminders</Text>
                  <Text style={styles.infoValue}>
                    {group.reminderEnabled ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>

              {group.prescribedBy ? (
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#64748B" />
                  <Text style={styles.detailText}>Prescribed by {group.prescribedBy}</Text>
                </View>
              ) : null}
              {group.pharmacyName ? (
                <View style={styles.detailRow}>
                  <Ionicons name="storefront-outline" size={16} color="#64748B" />
                  <Text style={styles.detailText}>{group.pharmacyName}</Text>
                </View>
              ) : null}
              {group.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesLabel}>Plan Notes</Text>
                  <Text style={styles.notesText}>{group.notes}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Medicines</Text>
            </View>

            <View style={styles.medicinesCard}>
              {group.medicines.length === 0 ? (
                <View style={styles.emptyMedicines}>
                  <Ionicons name="medical-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyMedicinesText}>No medicines in this group yet.</Text>
                </View>
              ) : (
                group.medicines.map((medicine, index) => (
                  <MedicineGroupMedicineRow
                    key={medicine._id}
                    medicine={medicine}
                    index={index}
                  />
                ))
              )}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  content: {
    flex: 1,
    paddingTop: 56,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.45,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  patientName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
  },
  notesBox: {
    marginTop: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  medicinesCard: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyMedicines: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyMedicinesText: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748B",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  stateText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
