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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getMedicationsForUser,
  getDoseHistory,
  recordDose,
  getUserProfile,
  Medication,
  DoseHistory,
  ManagedPatient,
} from "../../utils/storage";
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
  const [doseHistory, setDoseHistory] = useState<DoseHistory[]>([]);
  const [managedPatients, setManagedPatients] = useState<ManagedPatient[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    try {
      const [meds, history, profile] = await Promise.all([
        getMedicationsForUser(patientId),
        getDoseHistory(),
        getUserProfile(),
      ]);
      setMedications(meds);
      setDoseHistory(history.filter(h => h.patientId === patientId || (patientId === 'self' && h.patientId === undefined)));
      setManagedPatients(profile?.managedPatients || []);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, [selectedDate, patientId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(selectedDate);

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
      const hasDoses = doseHistory.some(
        (dose) => new Date(dose.timestamp).toDateString() === date.toDateString()
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
    const dateStr = selectedDate.toDateString();
    const dayDoses = doseHistory.filter(
      (dose) => new Date(dose.timestamp).toDateString() === dateStr
    );

    if (medications.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="medical-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No medications scheduled</Text>
            </View>
        );
    }

    return medications.map((medication, index) => {
      const taken = dayDoses.some(
        (dose) => dose.medicationId === medication.id && dose.taken
      );

      return (
        <Animated.View 
            key={medication.id} 
            style={[styles.medicationCard, { opacity: fadeAnim }]}
        >
          <View style={[styles.statusIndicator, { backgroundColor: medication.color }]} />
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{medication.name}</Text>
            <View style={styles.medicationSubRow}>
                <Ionicons name="time-outline" size={14} color="#64748B" />
                <Text style={styles.medicationTime}>{medication.times[0]}</Text>
                <View style={styles.dotSeparator} />
                <Text style={styles.medicationDosage}>{medication.dosage}</Text>
            </View>
          </View>
          
          {taken ? (
            <View style={styles.takenBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.takenText}>Done</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.takeDoseButton}
              onPress={async () => {
                await recordDose(medication.id, true, new Date().toISOString(), patientId);
                loadData();
              }}
            >
              <LinearGradient 
                colors={[medication.color || "#1a8e2d", medication.color || "#146922"]} 
                style={styles.takeButtonGradient}
              >
                <Text style={styles.takeDoseText}>Take</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      );
    });
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

      <View style={styles.mainContent}>
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

        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scheduleList}
        >
            {renderMedicationsForDate()}
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
  selectedDayBox: {
    // No extra border needed for the box itself in this design, 
    // but keeping it for potential future hover/selection effects
  },
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
    fontSize: 18,
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
  medicationCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  medicationSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  medicationTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 4,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 8,
  },
  medicationDosage: {
    fontSize: 13,
    color: "#64748B",
  },
  takeDoseButton: {
    overflow: "hidden",
    borderRadius: 14,
  },
  takeButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  takeDoseText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  takenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  takenText: {
    color: "#10B981",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
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

