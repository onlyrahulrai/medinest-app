import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Medication,
  ManagedPatient,
} from "../../utils/storage";
import { profileService, mapRemoteProfileToLocalProfile } from "../../services/api/profile";
import { medicineService, Medicine as ApiMedicine } from "../../services/api/medicines";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [patientId, setPatientId] = useState<string>((params.patientId as string) || 'self');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medications, setMedications] = useState<Medication[]>([]);
  const [managedPatients, setManagedPatients] = useState<ManagedPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const dateStr = selectedDate.toISOString();
      const [remoteProfile, allMeds] = await Promise.all([
        profileService.fetchCurrentUserProfile(),
        medicineService.getAllMedicines('active', dateStr, patientId || undefined)
      ]);

      const profile = mapRemoteProfileToLocalProfile(remoteProfile);
      setManagedPatients(profile?.managedPatients || []);

      // Filter meds by patient if needed (if backend returns all, currently scoped to self)
      // For now, patientId 'self' is the only one fully supported by the standard getAllMedicines

      const mapped: Medication[] = allMeds.map(m => ({
        id: m._id!,
        name: m.name,
        dosage: m.dosage,
        times: m.schedule.times,
        color: m.color || "#059669",
        logs: m.logs as any,
        addedBy: m.userId !== remoteProfile._id ? 'caregiver' : 'patient'
      } as any));

      setMedications(mapped);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, [selectedDate, patientId]);

  // Initial load + reload when selectedDate or patientId changes
  // useEffect(() => {
  //   loadData();
  // }, [loadData]);

  // Also reload when screen regains focus (e.g. navigating back from edit)
  // useFocusEffect(
  //   useCallback(() => {
  //     loadData();
  //   }, [loadData])
  // );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(selectedDate);

  const isDoseTaken = (medicationId: string) => {
    const med = medications.find(m => m.id === medicationId);
    if (!med) return false;

    const dateStr = selectedDate.toDateString();
    const logs = (med as any).logs || [];

    return logs.some((log: any) =>
      log.status === 'taken' &&
      new Date(log.takenAt).toDateString() === dateStr
    );
  };

  const handleTakeDose = async (medication: Medication) => {
    try {
      await medicineService.logIntake(medication.id, {
        takenAt: new Date().toISOString(),
        status: 'taken',
        loggedBy: 'self'
      });
      await loadData();
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };

  const renderCalendar = () => {
    const calendar: JSX.Element[] = [];
    let week: JSX.Element[] = [];

    // Add empty cells
    for (let i = 0; i < firstDay; i++) {
      week.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Add days
    for (let day = 1; day <= days; day++) {
      const date = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        day
      );
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const hasDoses = medications.some(med =>
        (med as any).logs?.some((log: any) =>
          new Date(log.takenAt).toDateString() === date.toDateString()
        )
      );

      week.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDayBox,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <View style={[styles.dayInner, isSelected && styles.selectedDayInner, isToday && !isSelected && styles.todayInner]}>
            <Text style={[styles.dayText, isSelected && styles.selectedDayText, isToday && !isSelected && styles.todayText]}>
              {day}
            </Text>
          </View>
          {hasDoses && <View style={[styles.eventDot, isSelected && styles.selectedEventDot]} />}
        </TouchableOpacity>
      );

      if ((firstDay + day) % 7 === 0 || day === days) {
        calendar.push(
          <View key={day} style={styles.calendarWeek}>
            {week}
          </View>
        );
        week = [];
      }
    }

    return calendar;
  };

  const renderMedicationsForDate = () => {
    // Apply search filter
    const filteredMeds = medications.filter(med =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (medications.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-clear-outline" size={60} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>No Medications Scheduled</Text>
          <Text style={styles.emptyStateSub}>Nothing scheduled for this date.</Text>
        </View>
      );
    }

    if (filteredMeds.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyStateTitle}>
            No medications match "{searchQuery}"
          </Text>
        </View>
      );
    }

    // Group medications by scheduleGroupId AND time slot (same as home screen)
    const grouped: { key: string; meds: Medication[]; time: string }[] = [];
    const seen = new Set<string>();

    for (const med of filteredMeds) {
      const timeStr = med.times[0] || "No time";
      const groupingKey = med.scheduleGroupId
        ? `${med.scheduleGroupId}_${timeStr}`
        : `${med.id}_${timeStr}`;

      if (seen.has(groupingKey)) continue;
      seen.add(groupingKey);

      grouped.push({
        key: groupingKey,
        time: timeStr,
        meds: filteredMeds.filter(m => {
          const mTime = m.times[0] || "No time";
          if (med.scheduleGroupId) {
            return m.scheduleGroupId === med.scheduleGroupId && mTime === timeStr;
          }
          return m.id === med.id && mTime === timeStr;
        }),
      });
    }

    return (
      <View style={styles.timelineContainer}>
        {grouped.map((group, index) => {
          const allTaken = group.meds.every(m => isDoseTaken(m.id));
          const isGroup = group.meds.length > 1;

          return (
            <View key={group.key} style={styles.timelineRow}>
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineDot, allTaken && styles.timelineDotTaken]} />
                {index !== grouped.length - 1 && <View style={styles.timelineLine} />}
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
                  onPress={() => router.push(`/medications/edit?id=${group.meds[0].id}`)}
                >
                  <Ionicons name="create-outline" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#065F46", "#064E3B"]}
        style={styles.headerBackground}
      >
        <View style={styles.topNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Calendar</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="calendar-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
            style={styles.monthArrow}
          >
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.monthName}>
            {selectedDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </Text>
          <TouchableOpacity
            onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
            style={styles.monthArrow}
          >
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {managedPatients.length > 0 && (
          <View style={styles.patientSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.patientChip, patientId === 'self' && styles.patientChipActive]}
                onPress={() => setPatientId('self')}
              >
                <Text style={[styles.patientChipText, patientId === 'self' && styles.patientChipTextActive]}>Me</Text>
              </TouchableOpacity>
              {managedPatients.map(patient => (
                <TouchableOpacity
                  key={patient.id}
                  style={[styles.patientChip, patientId === patient.id && styles.patientChipActive]}
                  onPress={() => setPatientId(patient.id)}
                >
                  <Text style={[styles.patientChipText, patientId === patient.id && styles.patientChipTextActive]}>{patient.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.calendarCard}>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, i) => (
              <Text key={i} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>
          <View>{renderCalendar()}</View>
        </View>

        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleTitle}>Daily Schedule</Text>
          <Text style={styles.scheduleDate}>
            {selectedDate.toLocaleDateString("default", { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {renderMedicationsForDate()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBackground: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 80,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  topNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  monthSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  monthArrow: {
    padding: 8,
  },
  monthName: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  mainContent: {
    flex: 1,
    marginTop: -60,
    paddingHorizontal: 20,
  },
  calendarCard: {
    backgroundColor: "white",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 24,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  calendarWeek: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  selectedDayBox: {},
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  todayInner: {
    backgroundColor: "#ECFDF5",
  },
  selectedDayInner: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  todayText: {
    color: "#10B981",
  },
  selectedDayText: {
    color: "white",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#10B981",
    marginTop: 4,
  },
  selectedEventDot: {
    backgroundColor: "white",
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  scheduleDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  scheduleList: {
    paddingBottom: 40,
  },
  // ── Search Bar ──
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    padding: 0,
  },
  // ── Empty States ──
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
  // ── Premium Dose Card ──
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
  // ── Patient Selector ──
  patientSelector: {
    marginBottom: 15,
  },
  patientChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  patientChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  patientChipText: {
    color: "#666",
    fontWeight: "600",
  },
  patientChipTextActive: {
    color: "white",
  },
});

