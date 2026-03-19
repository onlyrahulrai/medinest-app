import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NotificationBell from "../../components/caregiver/NotificationBell";
import AlertCard from "../../components/caregiver/AlertCard";
import FamilyAvatarList, {
  FamilyMember,
} from "../../components/caregiver/FamilyAvatar";

import FloatingAddButton from "../../components/caregiver/FloatingAddButton";
import { mockStats } from "../../components/caregiver/mockStats";
import { 
  getUserProfile, 
  getMedicationsForUser, 
  getDoseHistory, 
  recordDose, 
  addManagedPatient, 
  checkMissedDoses,
  getMissedDosesForCaregiver,
  ManagedPatient, 
  Medication, 
  DoseHistory 
} from "../../utils/storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect } from "react";

// ─── mock data ────────────────────────────────────────────────
const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "1", name: "David", isOnline: true, statusText: "Needs Attention", nextMedication: "Atorvastatin (1:00 PM)" },
  { id: "2", name: "Mary", image: "https://xsgames.co/randomusers/avatar.php?g=female&r=1", statusText: "On Track", nextMedication: "Aspirin (8:00 PM)" },
  { id: "3", name: "James", image: "https://xsgames.co/randomusers/avatar.php?g=male&r=2", statusText: "On Track", nextMedication: "Insulin (1:00 PM)" },
  { id: "4", name: "Sarah", image: "https://xsgames.co/randomusers/avatar.php?g=female&r=3", statusText: "All taken", nextMedication: "" },
];




// ─── component ────────────────────────────────────────────────
export default function CaregiverDashboard() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [activeTab, setActiveTab] = useState("Family");
  const [managedPatients, setManagedPatients] = useState<ManagedPatient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseHistory, setDoseHistory] = useState<DoseHistory[]>([]);
  const [missedAlerts, setMissedAlerts] = useState<Array<{ medName: string; patientName: string; time: string }>>([]);
  
  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("");

  const loadData = useCallback(async () => {
    await checkMissedDoses(); // Update missed status first
    const profile = await getUserProfile();
    const patients = profile?.managedPatients || [];
    setManagedPatients(patients);
    
    if (patients.length > 0 && !selectedMember) {
      setSelectedMember(patients[0].id);
    }

    const [meds, history, alerts] = await Promise.all([
        selectedMember ? getMedicationsForUser(selectedMember) : Promise.resolve([]),
        getDoseHistory(),
        getMissedDosesForCaregiver()
    ]);
    
    setMedications(meds);
    setDoseHistory(history);
    setMissedAlerts(alerts);
  }, [selectedMember]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSaveMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert("Error", "Please enter a name for the family member");
      return;
    }
    const newMember: ManagedPatient = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName.trim(),
      image: newMemberAvatar || `https://xsgames.co/randomusers/avatar.php?g=pixel&r=${Math.random()}`,
    };
    
    await addManagedPatient(newMember);
    await loadData();
    setShowAddMemberModal(false);
    setNewMemberName("");
    setNewMemberAvatar("");
    Alert.alert("Success", `${newMemberName} added successfully`);
  };

  const handleViewActivity = (id: string) => {
    router.push(`/caregiver/activity?patientId=${id}`);
  };

  const isDoseTaken = (medicationId: string) => {
    const today = new Date().toDateString();
    return doseHistory.some(
      (dose) =>
        dose.medicationId === medicationId &&
        dose.taken &&
        new Date(dose.timestamp).toDateString() === today
    );
  };

  const handleTakeDose = async (medication: Medication) => {
    try {
      await recordDose(medication.id, true, new Date().toISOString(), selectedMember, 'taken');
      await loadData();
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };

  const handleEdit = (medId: string) => {
    router.push(`/medications/edit?id=${medId}&patientId=${selectedMember}`);
  };

  // Group medications by scheduleGroupId AND time slot (same as home screen)
  const getGroupedMedications = () => {
    const grouped: { key: string; meds: Medication[]; time: string }[] = [];
    const seen = new Set<string>();

    for (const med of medications) {
      const timeStr = med.times[0] || "No time";
      const groupingKey = med.scheduleGroupId
        ? `${med.scheduleGroupId}_${timeStr}`
        : `${med.id}_${timeStr}`;

      if (seen.has(groupingKey)) continue;
      seen.add(groupingKey);

      grouped.push({
        key: groupingKey,
        time: timeStr,
        meds: medications.filter(m => {
          const mTime = m.times[0] || "No time";
          if (med.scheduleGroupId) {
            return m.scheduleGroupId === med.scheduleGroupId && mTime === timeStr;
          }
          return m.id === med.id && mTime === timeStr;
        }),
      });
    }

    return grouped;
  };

  const groupedMedications = getGroupedMedications();

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#065F46", "#064E3B"]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.appName}>Caregiver Dashboard</Text>
            <Text style={styles.subtitle}>Overview of your family's health</Text>
          </View>
          <NotificationBell
            count={2}
            onPress={() => Alert.alert("Notifications", "You have 2 new alerts")}
            color="white"
            style={styles.iconBtn}
          />
        </View>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsScroll}
        style={styles.statsContainer}
      >
        {mockStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Critical Alerts ── */}
        <View style={styles.section}>

          {missedAlerts.length > 0 ? (
            missedAlerts.map((alert, index) => (
                <AlertCard
                    key={index}
                    type="missed"
                    patientName={alert.patientName}
                    alertText={`Missed: ${alert.medName}`}
                    timeAgo={alert.time}
                    actions={[
                        {
                            label: `Contact ${alert.patientName}`,
                            primary: true,
                            onPress: () => Alert.alert("Contact", `Reaching out to ${alert.patientName}...`),
                        },
                    ]}
                />
            ))
          ) : (
            <AlertCard
                type="refill"
                patientName="No Alerts"
                alertText="All medications for your patients are on track."
                timeAgo="Now"
                actions={[]}
            />
          )}
        </View>

        {/* ── Family Members ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            <TouchableOpacity
              onPress={() => setShowAddMemberModal(true)}
            >
              <Text style={styles.addMemberLink}>+ Add Member</Text>
            </TouchableOpacity>
          </View>
          {managedPatients.length > 0 ? (
            <FamilyAvatarList
                members={managedPatients}
                selectedId={selectedMember}
                onSelect={setSelectedMember}
                onAddMember={() => setShowAddMemberModal(true)}
                onAddMedication={(id) => router.push(`/medications/add?patientId=${id}`)}
                onViewActivity={handleViewActivity}
            />
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>No family members added yet.</Text>
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        {selectedMember && managedPatients.some(p => p.id === selectedMember) && (
          <View style={[styles.section, { paddingHorizontal: 20 }]}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => router.push(`/medications/add?patientId=${selectedMember}`)}
            >
              <LinearGradient
                colors={["#ecfdf5", "#d1fae5"]}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.quickActionContent}>
                  <View style={styles.quickActionIconContainer}>
                    <Ionicons name="medkit-outline" size={24} color="#059669" />
                  </View>
                  <View>
                    <Text style={styles.quickActionTitle}>Add Medication</Text>
                    <Text style={styles.quickActionSubtitle}>
                      Schedule for {managedPatients.find(p => p.id === selectedMember)?.name}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { marginTop: 12 }]}
              onPress={() => handleViewActivity(selectedMember)}
            >
              <LinearGradient
                colors={["#f5f3ff", "#ede9fe"]}
                style={styles.quickActionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.quickActionContent}>
                  <View style={[styles.quickActionIconContainer, { backgroundColor: "#f5f3ff" }]}>
                    <Ionicons name="stats-chart-outline" size={24} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={[styles.quickActionTitle, { color: "#4F46E5" }]}>View Activity</Text>
                    <Text style={[styles.quickActionSubtitle, { color: "#6366F1" }]}>
                      Daily metrics for {managedPatients.find(p => p.id === selectedMember)?.name}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6366F1" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Today's Schedule ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
            })}</Text>
          </View>
          <View style={{ paddingHorizontal: 20 }}>
            {medications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-clear-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>No Medications</Text>
                <Text style={styles.emptyStateSub}>No medications scheduled for this patient.</Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {groupedMedications.map((group, index) => {
                  const allTaken = group.meds.every(m => isDoseTaken(m.id));
                  const isGroup = group.meds.length > 1;

                  return (
                    <View key={group.key} style={styles.timelineRow}>
                      <View style={styles.timelineTrack}>
                        <View style={[styles.timelineDot, allTaken && styles.timelineDotTaken]} />
                        {index !== groupedMedications.length - 1 && <View style={styles.timelineLine} />}
                      </View>

                      <View style={[styles.premiumDoseCard, allTaken && styles.premiumDoseCardTaken]}>
                        {isGroup && (
                          <View style={styles.groupBadge}>
                            <Ionicons name="layers-outline" size={12} color="#059669" />
                            <Text style={styles.groupBadgeText}>{group.meds.length} medicines • {group.time}</Text>
                          </View>
                        )}

                        {group.meds.map((medication) => {
                          const isTaken = isDoseTaken(medication.id);
                          return (
                            <View key={medication.id} style={[styles.groupMedRow, isGroup && styles.groupMedRowBorder]}>
                              <View style={styles.doseInfo}>
                                <Text style={[styles.premiumMedicineName, isTaken && styles.premiumTextTaken]}>
                                  {medication.name}
                                  {medication.addedBy === 'caregiver' && (
                                    <Text style={styles.caregiverBadgeText}> ✨</Text>
                                  )}
                                </Text>
                                <Text style={styles.premiumDosageInfo}>
                                  {medication.dosage}{!isGroup ? ` • ${medication.times[0]}` : ''}
                                </Text>
                              </View>
                              <View style={styles.cardActions}>
                                {isTaken ? (
                                  <View style={styles.takenBadge}>
                                    <Ionicons name="checkmark" size={16} color="#059669" />
                                    <Text style={styles.takenBadgeText}>Taken</Text>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.premiumTakeBtn}
                                    onPress={() => handleTakeDose(medication)}
                                  >
                                    <Text style={styles.premiumTakeBtnText}>Take</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}

                        <TouchableOpacity
                          style={styles.editIconBtn}
                          onPress={() => handleEdit(group.meds[0].id)}
                        >
                          <Ionicons name="create-outline" size={18} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Member Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Mom, Dad, John"
                placeholderTextColor="#999"
                value={newMemberName}
                onChangeText={setNewMemberName}
              />

              <Text style={styles.inputLabel}>Avatar URL (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://..."
                placeholderTextColor="#999"
                value={newMemberAvatar}
                onChangeText={setNewMemberAvatar}
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveMemberButton} onPress={handleSaveMember}>
                <LinearGradient
                  colors={["#1a8e2d", "#146922"]}
                  style={styles.saveMemberGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.saveMemberText}>Add Member</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FloatingAddButton onPress={() => router.push(`/medications/add?patientId=${selectedMember}`)} />

    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  /* Header */
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  /* Stats */
  statsContainer: {
    flexGrow: 0,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statsScroll: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    borderRadius: 16,
    padding: 16,
    width: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
  },
  statLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    marginTop: 4,
  },
  /* Scroll */
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  /* Sections */
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.3,
  },
  addMemberLink: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a8e2d",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeModalButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  saveMemberButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  saveMemberGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  saveMemberText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  quickActionCard: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1fae5",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: "#059669",
    marginTop: 2,
    fontWeight: "500",
  },
  // ── Timeline ──
  timelineContainer: {
    paddingTop: 16,
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineTrack: {
    width: 30,
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
    marginTop: 24,
    zIndex: 2,
  },
  timelineDotTaken: {
    backgroundColor: "#10B981",
  },
  timelineLine: {
    position: "absolute",
    top: 36,
    bottom: -32,
    width: 2,
    backgroundColor: "#E2E8F0",
    borderStyle: "dashed",
    zIndex: 1,
  },
  premiumDoseCard: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden",
  },
  premiumDoseCardTaken: {
    backgroundColor: "#F8FAFC",
    shadowOpacity: 0.01,
  },
  premiumMedicineName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  premiumTextTaken: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
  premiumDosageInfo: {
    fontSize: 14,
    color: "#64748B",
  },
  premiumTakeBtn: {
    backgroundColor: "#065F46",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  premiumTakeBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  doseInfo: {
    flex: 1,
    justifyContent: "center",
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  takenBadgeText: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 8,
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "flex-start",
    gap: 4,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  groupMedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  groupMedRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  caregiverBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "white",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderStyle: "dashed",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 16,
  },
  emptyStateSub: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 8,
  },
});
