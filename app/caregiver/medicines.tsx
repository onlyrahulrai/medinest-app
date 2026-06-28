import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import MedicineGroupCard from "../../components/medications/MedicineGroupCard";
import {
  getCaregiverManagedMedicineGroups,
  type MedicineGroupSummary,
} from "../../services/api/medicineGroups";

type PatientSection = {
  patientId: string;
  patientName: string;
  groups: MedicineGroupSummary[];
};

export default function CaregiverMedicinesScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<MedicineGroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getCaregiverManagedMedicineGroups();
      setGroups(response.results || []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load patient medicines";
      setError(message);
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const sections = useMemo((): PatientSection[] => {
    const map = new Map<string, PatientSection>();

    for (const group of groups) {
      const patientId = group.user;
      const patientName = group.patientName || "Patient";
      const existing = map.get(patientId);

      if (existing) {
        existing.groups.push(group);
      } else {
        map.set(patientId, { patientId, patientName, groups: [group] });
      }
    }

    return Array.from(map.values());
  }, [groups]);

  const openGroup = (group: MedicineGroupSummary) => {
    router.push({
      pathname: "/medications/groups/[id]",
      params: { id: group._id, patientId: group.user },
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.stateText}>Loading patient medicines...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to load medicines</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => loadGroups()}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (sections.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="medkit-outline" size={56} color="#CBD5E1" />
          <Text style={styles.errorTitle}>No Patient Medicines Yet</Text>
          <Text style={styles.stateText}>
            Medicine groups you add for linked patients will appear here, grouped by patient.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/caregiver")}>
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return sections.map((section) => (
      <View key={section.patientId} style={styles.patientSection}>
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person" size={18} color="#059669" />
          </View>
          <View style={styles.patientHeaderText}>
            <Text style={styles.patientName}>{section.patientName}</Text>
            <Text style={styles.patientMeta}>
              {section.groups.length} treatment {section.groups.length === 1 ? "plan" : "plans"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push(`/medications/add?patientId=${section.patientId}`)}
          >
            <Ionicons name="add" size={20} color="#059669" />
          </TouchableOpacity>
        </View>

        {section.groups.map((group) => (
          <MedicineGroupCard key={group._id} group={group} onPress={() => openGroup(group)} />
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#065F46", "#064E3B"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Patient Medicines</Text>
          <Text style={styles.headerSubtitle}>Treatment plans you manage</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/caregiver")} style={styles.backButton}>
          <Ionicons name="people" size={22} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadGroups(true)} tintColor="#059669" />
        }
      >
        {!loading && !error && groups.length > 0 ? (
          <Text style={styles.summaryText}>
            {groups.length} medicine {groups.length === 1 ? "group" : "groups"} across {sections.length}{" "}
            {sections.length === 1 ? "patient" : "patients"}
          </Text>
        ) : null}
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  summaryText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
    fontWeight: "600",
  },
  patientSection: {
    marginBottom: 28,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  patientHeaderText: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },
  patientMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  primaryButton: {
    marginTop: 20,
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
