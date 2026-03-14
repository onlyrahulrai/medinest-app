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
import ScheduleTimeline, {
  ScheduleMedication,
} from "../../components/caregiver/ScheduleTimeline";
import FloatingAddButton from "../../components/caregiver/FloatingAddButton";
import { mockStats } from "../../components/caregiver/mockStats";

// ─── mock data ────────────────────────────────────────────────
const FAMILY_MEMBERS: FamilyMember[] = [
  { id: "1", name: "David", isOnline: true, statusText: "Needs Attention", nextMedication: "Atorvastatin (1:00 PM)" },
  { id: "2", name: "Mary", image: "https://xsgames.co/randomusers/avatar.php?g=female&r=1", statusText: "On Track", nextMedication: "Aspirin (8:00 PM)" },
  { id: "3", name: "James", image: "https://xsgames.co/randomusers/avatar.php?g=male&r=2", statusText: "On Track", nextMedication: "Insulin (1:00 PM)" },
  { id: "4", name: "Sarah", image: "https://xsgames.co/randomusers/avatar.php?g=female&r=3", statusText: "All taken", nextMedication: "" },
];

const SCHEDULES: Record<
  string,
  {
    morning: ScheduleMedication[];
    afternoon: ScheduleMedication[];
    evening: ScheduleMedication[];
  }
> = {
  "1": {
    morning: [
      {
        id: "m1",
        name: "Lisinopril",
        dosage: "10mg",
        patientName: "David",
        category: "Heart Health",
        status: "taken",
      },
      {
        id: "m2",
        name: "Metformin",
        dosage: "500mg",
        patientName: "David",
        category: "Diabetes",
        status: "taken",
      },
    ],
    afternoon: [
      {
        id: "m3",
        name: "Atorvastatin",
        dosage: "20mg",
        patientName: "David",
        category: "Cholesterol",
        status: "pending",
      },
    ],
    evening: [
      {
        id: "m4",
        name: "Amlodipine",
        dosage: "5mg",
        patientName: "David",
        category: "Blood Pressure",
        status: "pending",
      },
    ],
  },
  "2": {
    morning: [
      {
        id: "m5",
        name: "Blood Pressure Meds",
        dosage: "50mg",
        patientName: "Mary",
        category: "Hypertension",
        status: "missed",
      },
    ],
    afternoon: [],
    evening: [
      {
        id: "m6",
        name: "Aspirin",
        dosage: "75mg",
        patientName: "Mary",
        category: "Heart Health",
        status: "pending",
      },
    ],
  },
  "3": {
    morning: [
      {
        id: "m7",
        name: "Insulin",
        dosage: "10 units",
        patientName: "James",
        category: "Diabetes",
        status: "taken",
      },
    ],
    afternoon: [
      {
        id: "m8",
        name: "Insulin",
        dosage: "10 units",
        patientName: "James",
        category: "Diabetes",
        status: "pending",
      },
    ],
    evening: [],
  },
  "4": {
    morning: [
      {
        id: "m9",
        name: "Vitamin D",
        dosage: "1000 IU",
        patientName: "Sarah",
        category: "Supplements",
        status: "taken",
      },
    ],
    afternoon: [],
    evening: [],
  },
};

// ─── component ────────────────────────────────────────────────
export default function CaregiverDashboard() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState("1");
  const [activeTab, setActiveTab] = useState("Family");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(FAMILY_MEMBERS);
  
  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAvatar, setNewMemberAvatar] = useState("");

  const handleSaveMember = () => {
    if (!newMemberName.trim()) {
      Alert.alert("Error", "Please enter a name for the family member");
      return;
    }
    const newMember: FamilyMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMemberName.trim(),
      image: newMemberAvatar || `https://xsgames.co/randomusers/avatar.php?g=pixel&r=${Math.random()}`,
    };
    setFamilyMembers([...familyMembers, newMember]);
    setShowAddMemberModal(false);
    setNewMemberName("");
    setNewMemberAvatar("");
    Alert.alert("Success", `${newMemberName} added successfully`);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const schedule = SCHEDULES[selectedMember] || {
    morning: [],
    afternoon: [],
    evening: [],
  };

  const timeSlots = [
    {
      label: "Morning",
      time: "8:00 AM",
      icon: "sunny-outline" as const,
      medications: schedule.morning,
    },
    {
      label: "Afternoon",
      time: "1:00 PM",
      icon: "partly-sunny-outline" as const,
      medications: schedule.afternoon,
    },
    {
      label: "Evening",
      time: "8:00 PM",
      icon: "moon-outline" as const,
      medications: schedule.evening,
    },
  ];

  const handleConfirm = (medId: string) => {
    Alert.alert("Confirmed", "Medication marked as taken.");
  };

  const handleEdit = (medId: string) => {
    router.push(`/medications/edit?id=${medId}`);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => router.push("/home")} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
            <Text style={styles.backButtonText}>Back to My Meds</Text>
          </TouchableOpacity>
          <NotificationBell
            count={2}
            onPress={() => Alert.alert("Notifications", "You have 2 new alerts")}
          />
        </View>
        <Text style={styles.appName}>Caregiver Dashboard</Text>
        <Text style={styles.subtitle}>Overview of your family's health</Text>
      </View>

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

          <AlertCard
            type="missed"
            patientName="Mary (Mom)"
            patientImage="https://xsgames.co/randomusers/avatar.php?g=female&r=1"
            alertText="Missed: Blood Pressure Meds"
            timeAgo="24m ago"
            actions={[
              {
                label: "Call Mary",
                primary: true,
                onPress: () => Alert.alert("Calling", "Calling Mary..."),
              },
              { label: "Logged" },
            ]}
          />
          <AlertCard
            type="refill"
            patientName="James (Son)"
            patientImage="https://xsgames.co/randomusers/avatar.php?g=male&r=2"
            alertText="Inventory Low: Insulin (2 doses left)"
            timeAgo="1h ago"
            actions={[
              {
                label: "Order Refill Now",
                primary: true,
                onPress: () => Alert.alert("Refill", "Ordering refill..."),
              },
            ]}
          />
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
          <FamilyAvatarList
            members={familyMembers}
            selectedId={selectedMember}
            onSelect={setSelectedMember}
            onAddMember={() => setShowAddMemberModal(true)}
          />
        </View>

        {/* ── Today's Schedule ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Text style={styles.dateText}>{today}</Text>
          </View>
          <ScheduleTimeline
            timeSlots={timeSlots}
            onConfirm={handleConfirm}
            onEdit={handleEdit}
          />
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

      {/* ── FAB ── */}
      <FloatingAddButton onPress={() => router.push("/medications/add")} />

      {/* ── Bottom Navigation ── */}
      <View style={styles.bottomNav}>
        {([
          { key: "Home", icon: "home-outline", iconActive: "home" },
          { key: "Family", icon: "people-outline", iconActive: "people" },
          { key: "Events", icon: "calendar-outline", iconActive: "calendar" },
          { key: "Settings", icon: "settings-outline", iconActive: "settings" },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(tab.key);
                if (tab.key === "Home") router.push("/home");
                if (tab.key === "Settings") router.push("/settings");
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.icon}
                size={24}
                color={isActive ? "#1a8e2d" : "#999"}
              />
              <Text
                style={[styles.navText, isActive && styles.navTextActive]}
              >
                {tab.key}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    paddingBottom: 20,
    backgroundColor: "white",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#333",
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#666",
    marginTop: 4,
  },
  /* Stats */
  statsContainer: {
    flexGrow: 0,
    backgroundColor: "white",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statsScroll: {
    paddingHorizontal: 20,
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
  /* Bottom Nav */
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  navText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  navTextActive: {
    color: "#1a8e2d",
    fontWeight: "700",
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
});
