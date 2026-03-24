import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  Alert,
  AppState,
  Image,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import {
  Medication,
  getUserProfile as getLocalUserProfile,
} from "../../utils/storage";
import { profileService, mapRemoteProfileToLocalProfile } from "../../services/api/profile";
import { medicineService, Medicine as ApiMedicine } from "../../services/api/medicines";
import { useFocusEffect } from "@react-navigation/native";
import {
  registerForPushNotificationsAsync,
  scheduleMedicationReminder,
} from "../../utils/notifications";
import { getTodaysLogs, updateLogStatus, type MedicineLog } from "../../services/api/medicineLogs";
import { getRoutines, type Routine } from "../../services/api/routines";

const { width } = Dimensions.get("window");

// Create animated circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Dynamic greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: "sunny" as const, emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", icon: "partly-sunny" as const, emoji: "🌤️" };
  return { text: "Good Evening", icon: "moon" as const, emoji: "🌙" };
};

// Daily health tips pool
const HEALTH_TIPS = [
  // 💊 Medication Adherence
  { tip: "Take your medications with food to reduce stomach irritation.", icon: "restaurant" as const, color: "#F59E0B" },
  { tip: "Avoid caffeine close to your evening medications.", icon: "cafe" as const, color: "#DC2626" },
  { tip: "Store medications in a cool, dry place away from sunlight.", icon: "shield-checkmark" as const, color: "#7C3AED" },
  { tip: "Never double up on a missed dose — consult your doctor instead.", icon: "alert-circle" as const, color: "#EF4444" },
  { tip: "Set phone alarms as a backup for your medication reminders.", icon: "alarm" as const, color: "#F97316" },

  // 💧 Hydration
  { tip: "Stay hydrated! Drink at least 8 glasses of water today.", icon: "water" as const, color: "#0EA5E9" },
  { tip: "Drinking water before meals can aid digestion and absorption.", icon: "water" as const, color: "#06B6D4" },

  // 🏃 Exercise & Movement
  { tip: "A 20-minute walk can boost your mood and energy levels.", icon: "walk" as const, color: "#10B981" },
  { tip: "Gentle stretching in the morning improves circulation and flexibility.", icon: "body" as const, color: "#14B8A6" },
  { tip: "Even 10 minutes of light exercise can reduce anxiety significantly.", icon: "fitness" as const, color: "#059669" },

  // 😴 Sleep & Rest
  { tip: "Avoid screens 30 minutes before bed for better sleep quality.", icon: "moon" as const, color: "#6366F1" },
  { tip: "Set a consistent bedtime to improve medication absorption.", icon: "bed" as const, color: "#8B5CF6" },
  { tip: "Quality sleep strengthens your immune system and recovery.", icon: "bed" as const, color: "#4F46E5" },

  // 🥗 Nutrition
  { tip: "Eating leafy greens daily supports cardiovascular health.", icon: "nutrition" as const, color: "#22C55E" },
  { tip: "Omega-3 rich foods like fish can reduce inflammation.", icon: "fish" as const, color: "#0EA5E9" },
  { tip: "Limit processed sugar — it can interfere with some medications.", icon: "ice-cream" as const, color: "#EC4899" },

  // 🧘 Mental Health
  { tip: "Deep breathing for 5 minutes can lower stress and blood pressure.", icon: "leaf" as const, color: "#059669" },
  { tip: "Talking to someone you trust can lighten emotional burdens.", icon: "people" as const, color: "#8B5CF6" },
  { tip: "Practice gratitude — write 3 things you're thankful for today.", icon: "heart" as const, color: "#F43F5E" },

  // 📋 General Wellness
  { tip: "Keep a symptom journal — it helps your doctor help you better.", icon: "journal" as const, color: "#6366F1" },
  { tip: "Regular health checkups can catch issues before they escalate.", icon: "medkit" as const, color: "#059669" },
];

const QUICK_ACTIONS = [
  {
    icon: "add" as const,
    label: "Add Med",
    route: "/medications/add" as const,
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  {
    icon: "calendar" as const,
    label: "Calendar",
    route: "/calendar" as const,
    color: "#2563EB",
    bgColor: "#DBEAFE",
  },
  {
    icon: "time" as const,
    label: "History",
    route: "/history" as const,
    color: "#DB2777",
    bgColor: "#FCE7F3",
  },
  {
    icon: "medical" as const,
    label: "Refills",
    route: "/refills" as const,
    color: "#EA580C",
    bgColor: "#FFEDD5",
  },
  {
    icon: "people" as const,
    label: "Caregiver",
    route: "/caregiver" as const,
    color: "#4F46E5",
    bgColor: "#E0E7FF",
  },
];

interface CircularProgressProps {
  progress: number;
  totalDoses: number;
  completedDoses: number;
}

function CircularProgress({
  progress,
  totalDoses,
  completedDoses,
}: CircularProgressProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = 110; // Increased size to fit text comfortably
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size} style={styles.progressRing}>
        {/* Glow Effect / Backdrop */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#A7F3D0" // Soft, bright neon green for contrast
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<MedicineLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [userName, setUserName] = useState<string>("User");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [managedPatients, setManagedPatients] = useState<any[]>([]);

  const nextMedFade = useRef(new Animated.Value(0)).current;
  const nextMedSlide = useRef(new Animated.Value(20)).current;

  // Staggered animation refs for sections
  const streakAnim = useRef(new Animated.Value(0)).current;
  const quickActionsAnim = useRef(new Animated.Value(0)).current;
  const scheduleAnim = useRef(new Animated.Value(0)).current;
  const tipAnim = useRef(new Animated.Value(0)).current;

  // Dynamic greeting
  const greeting = getGreeting();

  // Daily health tip (rotates by day of year)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);

  const todaysTip = HEALTH_TIPS[dayOfYear % HEALTH_TIPS.length];

  // Mock weekly adherence data (in a real app, compute from doseHistory)
  const weeklyData = [
    { day: "Mon", status: "full" },
    { day: "Tue", status: "full" },
    { day: "Wed", status: "partial" },
    { day: "Thu", status: "full" },
    { day: "Fri", status: "full" },
    { day: "Sat", status: "missed" },
    { day: "Sun", status: "none" },
  ];
  const streakDays = 5; // Mock streak count

  useEffect(() => {
    // Staggered entry animations
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(nextMedFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(nextMedSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(streakAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(quickActionsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(scheduleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(tipAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [nextMedFade, nextMedSlide, streakAnim, quickActionsAnim, scheduleAnim, tipAnim]);

  useEffect(() => {
    loadMedications();
  }, [activePatientId]);

  const loadMedications = useCallback(async () => {
    try {
      const [remoteProfile, allMeds, logs, fetchedRoutines] = await Promise.all([
        profileService.fetchCurrentUserProfile(),
        medicineService.getAllMedicines('active', undefined, activePatientId || undefined),
        getTodaysLogs(activePatientId || undefined),
        getRoutines().catch(() => [])
      ]);

      const profile = mapRemoteProfileToLocalProfile(remoteProfile);
      if (profile) {
        setUserName(profile.name);
        setManagedPatients(remoteProfile.managedPatients || []);
      }

      setMedications(allMeds.map(m => ({ ...m, id: m._id }) as any));
      setTodaysLogs(logs);
      setRoutines(fetchedRoutines);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }, [activePatientId]);

  const setupNotifications = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        console.log("Failed to get push notification token");
        return;
      }

      // Schedule reminders for all medications
      const medications = await medicineService.getAllMedicines();
      for (const medication of medications) {
        if (medication.reminderEnabled) {
          // Map to format notification helper expects
          await scheduleMedicationReminder({
            ...medication,
            id: medication._id,
            startDate: medication.duration.startDate,
            times: medication.customSchedule.enabled ? medication.customSchedule.times : routines.filter(r => medication.routineIds?.includes(r._id)).map(r => r.time)
          } as any);
        }
      }
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  // Use useEffect for initial load
  useEffect(() => {
    loadMedications();
    setupNotifications();

    // Handle app state changes for notifications
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        loadMedications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Use useFocusEffect for subsequent updates
  useFocusEffect(
    useCallback(() => {
      const unsubscribe = () => {
        // Cleanup if needed
      };

      loadMedications();
      return () => unsubscribe();
    }, [loadMedications])
  );

  const handleTakeDose = async (logId: string) => {
    try {
      await updateLogStatus(logId, { status: 'taken' });
      await loadMedications();
      Alert.alert("Success", "Medication recorded!");
    } catch (error) {
      console.error("Error recording dose:", error);
      Alert.alert("Error", "Failed to record dose. Please try again.");
    }
  };


  const completedDoses = todaysLogs.filter(l => l.status === 'taken').length;
  const totalDoses = todaysLogs.length;
  const progress = totalDoses > 0 ? completedDoses / totalDoses : 0;

  // Find next upcoming log
  const getNextMedication = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let nextLog: MedicineLog | null = null;
    let smallestDiff = Infinity;

    for (const log of todaysLogs) {
      if (log.status !== 'pending') continue;
      const [h, m] = log.scheduledTime.split(":").map(Number);
      const logMinutes = h * 60 + m;
      const diff = logMinutes - currentMinutes;
      // Also consider current/slightly past if still pending
      if (diff > -30 && diff < smallestDiff) {
        smallestDiff = diff;
        nextLog = log;
      }
    }
    return nextLog ? { log: nextLog, minutesUntil: smallestDiff } : null;
  };

  const nextMedLog = getNextMedication();

  const formatCountdown = (minutes: number) => {
    if (minutes <= 0) return "Now";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.mainWrapper}>
        <LinearGradient
          colors={["#065F46", "#064E3B"]}
          style={styles.headerBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.greetingHeader}>
              <Text style={styles.greetingSubtitle}>{greeting.text},</Text>
              <Text style={styles.greetingName}>{userName.split(' ')[0]} {greeting.emoji}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{userName.charAt(0).toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.glassOverviewCard}>
            <View style={styles.flex1}>
              <Text style={styles.overviewTitle}>Daily Progress</Text>
              <Text style={styles.overviewDoseCount}>
                {completedDoses}/{totalDoses}
              </Text>
              <Text style={styles.overviewSubtitle}>doses completed</Text>
            </View>
            <View style={styles.glowRingContainer}>
              <CircularProgress
                progress={progress}
                totalDoses={totalDoses}
                completedDoses={completedDoses}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Patient Selection for Caregivers */}
        {managedPatients.length > 0 && (
          <View style={styles.patientSelectorContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientScroll}>
              <TouchableOpacity
                style={[styles.patientChip, activePatientId === null && styles.patientChipActive]}
                onPress={() => setActivePatientId(null)}
              >
                <Text style={[styles.patientChipText, activePatientId === null && styles.patientChipTextActive]}>Me</Text>
              </TouchableOpacity>
              {managedPatients.map(patient => (
                <TouchableOpacity
                  key={patient._id}
                  style={[styles.patientChip, activePatientId === patient._id && styles.patientChipActive]}
                  onPress={() => setActivePatientId(patient._id)}
                >
                  <Text style={[styles.patientChipText, activePatientId === patient._id && styles.patientChipTextActive]}>{patient.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Next Medication Hero Card */}
        {totalDoses > 0 && (
          <View style={styles.heroSection}>
            <Animated.View style={[styles.heroCard, { opacity: nextMedFade, transform: [{ translateY: nextMedSlide }] }]}>
              {nextMedLog ? (
                <>
                  <View style={styles.heroCardHeader}>
                    <View style={styles.heroCardIconContainer}>
                      <Ionicons name="medical" size={26} color="#059669" />
                    </View>
                    <View style={styles.heroCardText}>
                      <Text style={styles.heroNextLabel}>UPCOMING MEDICATION</Text>
                      <Text style={styles.heroMedName}>{nextMedLog.log.medicineId?.name || 'Medication'}</Text>
                      <Text style={styles.heroMedDosage}>{nextMedLog.log.scheduledTime}</Text>
                    </View>
                  </View>

                  <View style={styles.heroCardFooter}>
                    <View style={styles.heroCountdown}>
                      <Ionicons name="time" size={18} color="#059669" />
                      <Text style={styles.heroCountdownText}>In {formatCountdown(nextMedLog.minutesUntil)}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.heroTakeBtn}
                      onPress={() => handleTakeDose(nextMedLog.log._id)}
                    >
                      <LinearGradient
                        colors={["#065F46", "#064E3B"]}
                        style={StyleSheet.absoluteFillObject}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      />
                      <Text style={styles.heroTakeText}>Mark Taken</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <View style={styles.heroAllDone}>
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                  <View style={styles.heroAllDoneTextOverlay}>
                    <Text style={styles.heroAllDoneTitle}>All caught up!</Text>
                    <Text style={styles.heroAllDoneSubtitle}>You have taken all medications for today.</Text>
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* Adherence Streak & Weekly Chart */}
        <Animated.View style={{ opacity: streakAnim }}>
          <View style={styles.streakSection}>
            <View style={styles.streakCard}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakFlame}>🔥</Text>
                <View style={styles.streakTextGroup}>
                  <Text style={styles.streakCount}>{streakDays} Day Streak!</Text>
                  <Text style={styles.streakSub}>Keep it going — you're doing amazing</Text>
                </View>
              </View>

              {/* Weekly mini chart */}
              <View style={styles.weeklyChart}>
                {weeklyData.map((d, i) => (
                  <View key={i} style={styles.weeklyDayCol}>
                    <View style={[
                      styles.weeklyDot,
                      d.status === "full" && styles.weeklyDotFull,
                      d.status === "partial" && styles.weeklyDotPartial,
                      d.status === "missed" && styles.weeklyDotMissed,
                    ]} />
                    <Text style={styles.weeklyDayLabel}>{d.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.quickActionsContainer, { opacity: quickActionsAnim }]}>
          <Text style={[styles.sectionPremiumTitle, { paddingHorizontal: 20 }]}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
            {QUICK_ACTIONS.map((action) => (
              <Link href={action.route} key={action.label} asChild>
                <TouchableOpacity style={styles.pillActionBtn}>
                  <View style={[styles.pillActionIcon, { backgroundColor: action.bgColor }]}>
                    <Ionicons name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <Text style={styles.pillActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Today's Schedule Options */}
        <Animated.View style={{ opacity: scheduleAnim }}>
          <View style={styles.scheduleSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionPremiumTitle, { marginBottom: 0 }]}>Today's Schedule</Text>
              <Link href="/calendar" asChild>
                <TouchableOpacity>
                  <Text style={styles.seeAllButton}>History</Text>
                </TouchableOpacity>
              </Link>
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

            {(() => {
              const filteredLogs = todaysLogs.filter(log =>
                log.medicineId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (todaysLogs.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-clear-outline" size={60} color="#CBD5E1" />
                    <Text style={styles.emptyStateTitle}>No Medications Today</Text>
                    <Text style={styles.emptyStateSub}>Take a break! You have nothing scheduled.</Text>
                  </View>
                );
              }

              if (filteredLogs.length === 0) {
                return (
                  <View style={styles.emptyState}>
                    <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyStateTitle}>
                      No medications match "{searchQuery}"
                    </Text>
                  </View>
                );
              }

              // Group logs by time slot
              const grouped: { time: string; logs: MedicineLog[] }[] = [];
              const timeSlots = Array.from(new Set(filteredLogs.map(l => l.scheduledTime))).sort();

              timeSlots.forEach(time => {
                grouped.push({
                  time,
                  logs: filteredLogs.filter(l => l.scheduledTime === time)
                });
              });

              return (
                <View style={styles.timelineContainer}>
                  {grouped.map((group, index) => {
                    const allTaken = group.logs.every(l => l.status === 'taken');
                    const routineName = routines.find(r => group.logs[0].routineId === r._id)?.name;

                    return (
                      <View key={group.time} style={styles.timelineRow}>
                        <View style={styles.timelineTrack}>
                          <View style={[styles.timelineDot, allTaken && styles.timelineDotTaken]} />
                          {index !== grouped.length - 1 && <View style={styles.timelineLine} />}
                        </View>

                        <View style={[styles.premiumDoseCard, allTaken && styles.premiumDoseCardTaken]}>
                          <View style={styles.groupBadge}>
                            <Ionicons name="time-outline" size={12} color="#059669" />
                            <Text style={styles.groupBadgeText}>{routineName || "Custom Slot"} • {group.time}</Text>
                          </View>

                          {group.logs.map((log) => {
                            const isTaken = log.status === 'taken';
                            return (
                              <View key={log._id} style={styles.groupMedRow}>
                                <View style={styles.doseInfo}>
                                  <Text style={[styles.premiumMedicineName, isTaken && styles.premiumTextTaken]}>
                                    {log.medicineId?.name || 'Medicine'}
                                  </Text>
                                  <Text style={styles.premiumDosageInfo}>
                                    Scheduled for {log.scheduledTime}
                                  </Text>
                                </View>
                                <View style={styles.cardActions}>
                                  {isTaken ? (
                                    <View style={styles.takenBadge}>
                                      <Ionicons name="checkmark" size={16} color="#059669" />
                                      <Text style={styles.takenBadgeText}>Taken</Text>
                                    </View>
                                  ) : (
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                      <TouchableOpacity
                                        style={styles.premiumTakeBtn}
                                        onPress={() => handleTakeDose(log._id)}
                                      >
                                        <Text style={styles.premiumTakeBtnText}>Take</Text>
                                      </TouchableOpacity>
                                    </View>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        </Animated.View>

        {/* Daily Health Tip */}
        <Animated.View style={{ opacity: tipAnim }}>
          <View style={styles.healthTipCard}>
            <LinearGradient
              colors={[`${todaysTip.color}15`, `${todaysTip.color}08`]}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.healthTipIcon, { backgroundColor: `${todaysTip.color}20` }]}>
              <Ionicons name={todaysTip.icon as any} size={24} color={todaysTip.color} />
            </View>
            <View style={styles.healthTipTextGroup}>
              <Text style={styles.healthTipLabel}>DAILY TIP</Text>
              <Text style={styles.healthTipText}>{todaysTip.tip}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {todaysLogs.map((log) => (
              <View key={log._id} style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <Ionicons name="medical" size={24} color="#059669" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    {log.medicineId?.name || 'Medicine'}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    Status: {log.status}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {log.scheduledTime}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    backgroundColor: "#F8FAFC", // Elegant light premium gray background
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greetingHeader: {
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
    fontWeight: "500",
  },
  greetingName: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  glassOverviewCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  overviewTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  overviewDoseCount: {
    color: "white",
    fontSize: 40,
    fontWeight: "900",
    marginBottom: 4,
    letterSpacing: -1,
  },
  overviewSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    fontWeight: "500",
  },
  glowRingContainer: {
    shadowColor: "#10B981", // Emerald glow shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  patientSelectorContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    zIndex: 20,
  },
  patientScroll: {
    gap: 12,
  },
  patientChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientChipActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  patientChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  patientChipTextActive: {
    color: "white",
  },
  quickActionsContainer: {
    marginBottom: 32,
  },
  sectionPremiumTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  quickActionsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  pillActionBtn: {
    alignItems: "center",
    width: 72,
  },
  pillActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pillActionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
  },
  scheduleSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16, // Title already has bottom margin, but keeping flexible
  },
  seeAllButton: {
    color: "#059669",
    fontWeight: "700",
    fontSize: 15,
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
  heroSection: {
    paddingHorizontal: 20,
    marginTop: -40, // Overlap onto the green gradient header
    marginBottom: 24,
    zIndex: 10,
  },
  heroCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#065F46",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  heroCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  heroCardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  heroCardText: {
    flex: 1,
  },
  heroNextLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroMedName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
  },
  heroMedDosage: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  heroCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  heroCountdown: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroCountdownText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
    marginLeft: 6,
  },
  heroTakeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTakeText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  heroAllDone: {
    alignItems: "center",
    paddingVertical: 20,
  },
  heroAllDoneTextOverlay: {
    alignItems: "center",
    marginTop: 12,
  },
  heroAllDoneTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 6,
  },
  heroAllDoneSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
  },
  allDoneCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  allDoneTextContainer: {
    flex: 1,
  },
  allDoneTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#065F46",
    marginBottom: 4,
  },
  allDoneSubtitle: {
    fontSize: 15,
    color: "#059669",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  progressTextContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  progressLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
  },
  progressRing: {
    transform: [{ rotate: "-90deg" }],
  },
  flex1: {
    flex: 1,
  },
  progressDetails: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  profileButton: {
    marginRight: 8,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  avatarMiniText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
  },
  notificationButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#E91E63",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  notificationCount: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
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
  // ── Streak Section ──
  streakSection: {
    paddingTop: 32,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  streakCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  streakHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  streakFlame: {
    fontSize: 36,
    marginRight: 14,
  },
  streakTextGroup: {
    flex: 1,
  },
  streakCount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 2,
  },
  streakSub: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  weeklyChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  weeklyDayCol: {
    alignItems: "center",
    flex: 1,
  },
  weeklyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E2E8F0",
    marginBottom: 8,
  },
  weeklyDotFull: {
    backgroundColor: "#10B981",
  },
  weeklyDotPartial: {
    backgroundColor: "#F59E0B",
  },
  weeklyDotMissed: {
    backgroundColor: "#EF4444",
  },
  weeklyDayLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
  },

  // ── Health Tip Card ──
  healthTipCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  healthTipIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  healthTipTextGroup: {
    flex: 1,
  },
  healthTipLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 6,
  },
  healthTipText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
    lineHeight: 22,
  },

  medIconImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  caregiverBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: 'bold',
    marginLeft: 4
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
});
