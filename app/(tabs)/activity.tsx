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
  Modal,
  TextInput,
  Alert,
  StatusBar,
  Switch
} from 'react-native';
import { saveUserProfile } from '../../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { getUserProfile, UserProfile } from '../../utils/storage';
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
  subtitle,
  progress = 0
}: {
  title: string;
  value: string;
  unit: string;
  icon: string;
  colors: string[];
  subtitle?: string;
  progress?: number;
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

export default function ActivityScreen() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [goal, setGoal] = useState<'weight_loss' | 'muscle_gain' | 'fitness' | 'strength' | 'none'>('none');
  const [frequency, setFrequency] = useState('');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'high'>('moderate');
  const [shareActivity, setShareActivity] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    const profile = await getUserProfile();
    setUserProfile(profile);
    if (profile) {
      setGoal(profile.workoutPlan?.goal || 'none');
      setFrequency(profile.workoutPlan?.frequency || '');
      setIntensity(profile.workoutPlan?.intensity || 'moderate');
      setShareActivity(profile.shareActivityWithCaregiver || false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSaveWorkoutPlan = async () => {
    if (!userProfile) return;
    if (!frequency.trim()) {
      Alert.alert("Missing Info", "Please enter how many times you want to exercise per week.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedProfile: UserProfile = {
        ...userProfile,
        workoutPlan: {
          goal,
          frequency,
          intensity,
          lastUpdated: new Date().toISOString()
        },
        shareActivityWithCaregiver: shareActivity
      };
      await saveUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setShowWorkoutModal(false);
      Alert.alert("Success", "Your workout plan has been updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to save workout plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const getGoalLabel = (g: string) => {
    switch (g) {
      case 'weight_loss': return 'Weight Loss';
      case 'muscle_gain': return 'Muscle Gain';
      case 'fitness': return 'General Fitness';
      case 'strength': return 'Strength';
      default: return 'None';
    }
  };
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
      >
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={["#065F46", "#064E3B"]}
            style={styles.headerBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Daily Activity</Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>Keep pushing your limits!</Text>
              {userProfile?.shareActivityWithCaregiver && (
                <View style={styles.sharedBadge}>
                  <Ionicons name="share-social" size={12} color="#4ADE80" />
                  <Text style={styles.sharedBadgeText}>Shared</Text>
                </View>
              )}
            </View>
          </View>

          {/* Hero Glass Section - Now inside headerWrapper */}
          <View style={styles.heroSection}>
            <View style={styles.glassOverviewCard}>
              <ProgressRing progress={0.72} color="#4ADE80" />
              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricItem}>
                  <Ionicons name="flame" size={20} color="#F87171" />
                  <Text style={styles.heroMetricValue}>452</Text>
                  <Text style={styles.heroMetricLabel}>kcal</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Ionicons name="navigate" size={20} color="#60A5FA" />
                  <Text style={styles.heroMetricValue}>5.2</Text>
                  <Text style={styles.heroMetricLabel}>km</Text>
                </View>
                <View style={styles.heroMetricDivider} />
                <View style={styles.heroMetricItem}>
                  <Ionicons name="timer" size={20} color="#FBBF24" />
                  <Text style={styles.heroMetricValue}>45</Text>
                  <Text style={styles.heroMetricLabel}>min</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Vital Metrics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vitality & Health</Text>
          <View style={styles.grid}>
            <ActivityCard
              title="Heart Rate"
              value="72"
              unit="bpm"
              icon="heart"
              colors={["#EF4444", "#DC2626"]}
              subtitle="Resting: 64 bpm"
            />
            <ActivityCard
              title="Sleep"
              value="7h 20m"
              unit=""
              icon="moon"
              colors={["#6366F1", "#4F46E5"]}
              subtitle="Deep: 2h 15m"
            />
          </View>
        </View>

        {/* Body & Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Body & Workouts</Text>
          <View style={styles.grid}>
            <ActivityCard
              title="Weight"
              value={userProfile?.weight || "70.0"}
              unit="kg"
              icon="scale"
              colors={["#8B5CF6", "#7C3AED"]}
              subtitle={userProfile?.weight ? "Updated from profile" : "Set in onboarding"}
            />
            <ActivityCard
              title="Workout"
              value={userProfile?.workoutPlan ? getGoalLabel(userProfile.workoutPlan.goal) : "Not Set"}
              unit=""
              icon="fitness"
              colors={["#F59E0B", "#D97706"]}
              subtitle={userProfile?.workoutPlan ? `${userProfile.workoutPlan.frequency}x week • ${userProfile.workoutPlan.intensity}` : "Tap to personalize"}
            />
          </View>
          <TouchableOpacity
            style={styles.personalizeButton}
            onPress={() => setShowWorkoutModal(true)}
          >
            <LinearGradient colors={["#4ADE80", "#22C55E"]} style={styles.personalizeGradient}>
              <Ionicons name="options" size={20} color="white" />
              <Text style={styles.personalizeText}>Personalize Plan</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Device & Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <View style={styles.deviceCard}>
            <View style={styles.deviceInfo}>
              <View style={styles.watchIconContainer}>
                <Ionicons name="watch" size={32} color="#059669" />
              </View>
              <View>
                <Text style={styles.deviceName}>MediWatch Pro</Text>
                <Text style={styles.deviceSync}>Last synced: 2 minutes ago</Text>
              </View>
            </View>
            <View style={styles.deviceBattery}>
              <Ionicons name="battery-full" size={20} color="#10B981" />
              <Text style={styles.batteryText}>85%</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Workout Plan Modal */}
      <Modal visible={showWorkoutModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Plan</Text>
              <TouchableOpacity onPress={() => setShowWorkoutModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>Your Goal</Text>
              <View style={styles.goalGrid}>
                {[
                  { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down' },
                  { id: 'muscle_gain', label: 'Muscle Gain', icon: 'barbell' },
                  { id: 'fitness', label: 'General Fitness', icon: 'heart' },
                  { id: 'strength', label: 'Strength', icon: 'flash' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.goalItem, goal === item.id && styles.goalItemActive]}
                    onPress={() => setGoal(item.id as any)}
                  >
                    <Ionicons name={item.icon as any} size={24} color={goal === item.id ? '#4CAF50' : '#666'} />
                    <Text style={[styles.goalLabel, goal === item.id && styles.goalLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Intensity Level</Text>
              <View style={styles.intensityContainer}>
                {(['light', 'moderate', 'high'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.intensityBtn, intensity === level && styles.intensityBtnActive]}
                    onPress={() => setIntensity(level)}
                  >
                    <Text style={[styles.intensityText, intensity === level && styles.intensityTextActive]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSectionTitle}>Frequency (sessions/week)</Text>
              <TextInput
                style={styles.modalInput}
                value={frequency}
                onChangeText={setFrequency}
                keyboardType="number-pad"
                placeholder="e.g. 3"
                placeholderTextColor="#999"
              />

              <View style={styles.shareRow}>
                <View style={styles.shareInfo}>
                  <Text style={styles.shareTitle}>Share with Caregiver</Text>
                  <Text style={styles.shareSubtitle}>Allow caregiver to see your daily activity</Text>
                </View>
                <Switch
                  value={shareActivity}
                  onValueChange={setShareActivity}
                  trackColor={{ false: '#e0e0e0', true: '#A5D6A7' }}
                  thumbColor={shareActivity ? '#4CAF50' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSaveWorkoutPlan}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Plan'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerWrapper: {
    backgroundColor: "#F8FAFC",
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 520 : 480, // Slightly more compact on Android
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40),
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    marginTop: 4,
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  sharedBadgeText: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 32, // Increased for better spacing before Vitality & Health
    marginTop: 0,
  },
  glassOverviewCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: Platform.OS === 'android' ? 0 : 8, // Set to 0 on Android because background is dark and elevation creates a black halo
    borderWidth: Platform.OS === 'android' ? 1.5 : 1, // Thicker border on Android to compensate for lack of shadow
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
    // Center text vertically on Android
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: Platform.OS === 'android' ? 2 : 3,
  },
  cardGradient: {
    padding: 20,
    minHeight: 160,
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
    fontWeight: '400',
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
    backgroundColor: '#F0FDFA',
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
  // Workout Modals & Personalization
  personalizeButton: {
    width: '100%',
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  personalizeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  personalizeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  goalItem: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    gap: 8,
  },
  goalItemActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FDF4',
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  goalLabelActive: {
    color: '#166534',
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  intensityBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
  },
  intensityBtnActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  intensityTextActive: {
    color: 'white',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 24,
  },
  shareInfo: {
    flex: 1,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  shareSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
