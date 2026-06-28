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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import MedicineGroupCard from "../../../components/medications/MedicineGroupCard";
import { MEDICATION_THEMES } from "../../../constants/medicationTheme";
import {
  getAllMedicineGroups,
  type MedicineGroupSummary,
} from "../../../services/api/medicineGroups";

export default function MedicineGroupsScreen() {
  const router = useRouter();
  const theme = MEDICATION_THEMES.self;
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

      const response = await getAllMedicineGroups();
      setGroups(response.results || []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to load medicine groups";
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

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={styles.stateText}>Loading medicine groups...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to load groups</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadGroups()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (groups.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="folder-open-outline" size={56} color="#CBD5E1" />
          <Text style={styles.errorTitle}>No Medicine Groups Yet</Text>
          <Text style={styles.stateText}>
            Create a treatment plan to organize medicines into groups.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push("/medications/add")}
          >
            <Text style={styles.retryButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return groups.map((group) => (
      <MedicineGroupCard
        key={group._id}
        group={group}
        onPress={() => router.push(`/medications/groups/${group._id}`)}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.headerColors} style={styles.headerGradient} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medicine Groups</Text>
          <TouchableOpacity
            onPress={() => router.push("/medications/add")}
            style={styles.backButton}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadGroups(true)}
              tintColor={theme.accent}
            />
          }
        >
          {!loading && !error && groups.length > 0 ? (
            <Text style={styles.summaryText}>
              {groups.length} treatment {groups.length === 1 ? "plan" : "plans"}
            </Text>
          ) : null}
          {renderContent()}
        </ScrollView>
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 12,
    fontWeight: "600",
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
  retryButton: {
    marginTop: 20,
    backgroundColor: MEDICATION_THEMES.self.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
});
