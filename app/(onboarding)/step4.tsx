import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { saveUserProfile, UserProfile } from '../../utils/storage';

export default function Step4Screen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Params from previous steps
    const name = params.name as string;
    const age = params.age as string;
    const gender = params.gender as string;
    const conditionsString = params.conditions as string;
    const phoneNumber = params.phoneNumber as string;
    const emergencyName = params.emergencyName as string;
    const emergencyPhone = params.emergencyPhone as string;
    const emergencyRelation = params.emergencyRelation as string;

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            const conditions = conditionsString ? JSON.parse(conditionsString) : [];

            const profileData: UserProfile = {
                name,
                age,
                gender,
                conditions,
                phoneNumber,
                caregivers: emergencyName ? [{
                    id: Math.random().toString(36).substr(2, 9),
                    name: emergencyName,
                    phoneNumber: emergencyPhone,
                    relation: emergencyRelation
                }] : [],
                reminderTimes: ['08:00', '20:00'], // Default reminder times, can be customized later
                soundEnabled,
                vibrationEnabled,
                isOnboardingCompleted: true,
            };

            await saveUserProfile(profileData);

            // Redirect to Home
            router.replace('/home');
        } catch (error) {
            console.error('Failed to save profile', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Preferences</Text>
                <Text style={styles.subtitle}>Customize how you want to be reminded about your medications.</Text>

                <View style={styles.formSection}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="volume-high-outline" size={24} color="#4CAF50" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingTitle}>Sound Alerts</Text>
                                <Text style={styles.settingDescription}>Play a sound for reminders</Text>
                            </View>
                        </View>
                        <Switch
                            value={soundEnabled}
                            onValueChange={setSoundEnabled}
                            trackColor={{ false: '#e0e0e0', true: '#A5D6A7' }}
                            thumbColor={soundEnabled ? '#4CAF50' : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Ionicons name="phone-portrait-outline" size={24} color="#4CAF50" style={styles.settingIcon} />
                            <View>
                                <Text style={styles.settingTitle}>Vibration</Text>
                                <Text style={styles.settingDescription}>Vibrate phone on alerts</Text>
                            </View>
                        </View>
                        <Switch
                            value={vibrationEnabled}
                            onValueChange={setVibrationEnabled}
                            trackColor={{ false: '#e0e0e0', true: '#A5D6A7' }}
                            thumbColor={vibrationEnabled ? '#4CAF50' : '#f4f3f4'}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
                    onPress={handleComplete}
                    disabled={isSaving}
                >
                    <LinearGradient
                        colors={isSaving ? ['#e0e0e0', '#e0e0e0'] : ['#4CAF50', '#2E7D32']}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={[styles.nextButtonText, isSaving && styles.nextButtonTextDisabled]}>
                            {isSaving ? 'Saving...' : 'Complete Setup'}
                        </Text>
                        {!isSaving && <Ionicons name="checkmark-circle-outline" size={24} color="white" />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    progressDotActive: {
        width: 24,
        backgroundColor: '#4CAF50',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        lineHeight: 24,
    },
    formSection: {
        gap: 24,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingIcon: {
        marginRight: 16,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: 'white',
    },
    nextButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    nextButtonDisabled: {
        opacity: 0.7,
    },
    nextButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    nextButtonTextDisabled: {
        color: '#999',
    }
});
