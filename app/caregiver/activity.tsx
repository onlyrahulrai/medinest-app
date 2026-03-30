import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { getUserProfile, UserProfile, getMedicationsForUser, Medication } from '../../utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ActivityCard = ({
  title,
  value,
  unit,
  icon,
  colors,
  subtitle
}: {
  title: string;
  value: string;
  unit: string;
  icon: string;
  colors: string[];
  subtitle?: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient colors={colors as [string, string, ...string[]]} style={styles.cardGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={20} color="white" />
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardUnit}>{unit}</Text>
        </View>
        {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </Animated.View>
  );
};

const ProgressRing = ({ progress, size = width * 0.4, strokeWidth = 14, color = "#10B981" }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new Animated.Value(0)).current;

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
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.ringTextContainer}>
        <Text style={styles.ringValue}>{Math.round(progress * 10000)}</Text>
        <Text style={styles.ringLabel}>STEPS</Text>
      </View>
    </View>
  );
};

export default function CaregiverActivityView() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPatientData = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);

    try {
      // In a real app, this would fetch the patient's profile from the server
      // For now, we'll try to find them in managedPatients or use mock data
      const profile = await getUserProfile();

      const patient = profile?.managedPatients.find(p => p.id === patientId);

      if (patient) {
        // Mocking the patient's privacy preference and metrics
        // In reality, this would be part of the patient's sync'd data
        setPatientProfile({
          ...patient,
          shareActivityWithCaregiver: true, // Default to true for demo if they are managed
          weight: "68.5",
          workoutPlan: {
            goal: 'fitness',
            frequency: '4',
            intensity: 'moderate'
          }
        });
      }
    } catch (error) {
      console.error("Failed to load patient activity", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [loadPatientData])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  const isShared = patientProfile?.shareActivityWithCaregiver;

  return (
    <View style={styles.container}>
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={["#4F46E5", "#312E81"]}
          style={styles.headerBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{patientProfile?.name || "Patient"}'s Activity</Text>
            <Text style={styles.headerSubtitle}>Weekly Health Overview</Text>
          </View>
        </View>

        {isShared ? (
          <View style={styles.heroSection}>
            <View style={styles.glassOverviewCard}>
              <ProgressRing progress={0.65} color="#818CF8" />
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricItem}>
                  <Ionicons name="flame" size={20} color="#F87171" />
                  <Text style={styles.heroMetricValue}>380</Text>
                  <Text style={styles.heroMetricLabel}>kcal</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Ionicons name="navigate" size={20} color="#60A5FA" />
                  <Text style={styles.heroMetricValue}>4.8</Text>
                  <Text style={styles.heroMetricLabel}>km</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Ionicons name="timer" size={20} color="#FBBF24" />
                  <Text style={styles.heroMetricValue}>35</Text>
                  <Text style={styles.heroMetricLabel}>min</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.heroSection}>
            <View style={styles.glassOverviewCard}>
              <Ionicons name="lock-closed" size={48} color="rgba(255,255,255,0.5)" />
              <Text style={styles.privacyTitle}>Activity Private</Text>
              <Text style={styles.privacySubtitle}>
                {patientProfile?.name} has not shared their activity metrics with caregivers.
              </Text>
            </View>
          </View>
        )}
      </View>

      {isShared && (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vitality & Health</Text>
            <View style={styles.grid}>
              <ActivityCard
                title="Heart Rate"
                value="75"
                unit="bpm"
                icon="heart"
                colors={["#EF4444", "#DC2626"]}
                subtitle="Avg: 72 bpm"
              />
              <ActivityCard
                title="Sleep"
                value="6h 45m"
                unit=""
                icon="moon"
                colors={["#6366F1", "#4F46E5"]}
                subtitle="Efficient sleep"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weight & Performance</Text>
            <View style={styles.grid}>
              <ActivityCard
                title="Current Weight"
                value={patientProfile?.weight || "--"}
                unit="kg"
                icon="scale"
                colors={["#8B5CF6", "#7C3AED"]}
                subtitle="Stable weight"
              />
              <ActivityCard
                title="Workout Goal"
                value="Losing"
                unit=""
                icon="fitness"
                colors={["#F59E0B", "#D97706"]}
                subtitle="4 sessions / week"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync Status</Text>
            <View style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <View style={styles.watchIconContainer}>
                  <Ionicons name="watch" size={32} color="#6366F1" />
                </View>
                <View>
                  <Text style={styles.deviceName}>MediWatch Pro</Text>
                  <Text style={styles.deviceSync}>Last synced: 15 minutes ago</Text>
                </View>
              </View>
              <View style={styles.deviceBattery}>
                <Ionicons name="battery-full" size={20} color="#10B981" />
                <Text style={styles.batteryText}>92%</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerWrapper: {
    backgroundColor: "#F8FAFC",
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 480 : 440,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40),
    paddingHorizontal: 24,
    paddingBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  glassOverviewCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  ringTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    includeFontPadding: false,
  },
  ringLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginTop: 2,
  },
  heroMetrics: {
    flexDirection: 'row',
    marginTop: 32,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  heroMetricItem: {
    alignItems: 'center',
  },
  heroMetricValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  heroMetricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  privacyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  privacySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 64) / 2,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  cardValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
  },
  cardUnit: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.8,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  deviceCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  deviceSync: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deviceBattery: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  batteryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
});
