import React, { useState, useEffect } from 'react';
import { saveOnboardingProfile, fetchCurrentUserProfile } from '../../services/api/profile';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import '../../utils/i18n';

export default function Step1Screen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
    const [gender, setGender] = useState('');
    const [weight, setWeight] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const phoneNumber = useLocalSearchParams().phoneNumber as string;

    // Pre-fill from saved profile
    useEffect(() => {
        fetchCurrentUserProfile().then((profile) => {
            if (profile?.name) setName(profile.name);
            if (profile?.dateOfBirth) setDateOfBirth(new Date(profile.dateOfBirth));
            if (profile?.gender) setGender(profile.gender);
            if (profile?.weight != null) setWeight(String(profile.weight));
        }).catch(() => {});
    }, []);

    const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const getAge = (dob: Date) => {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    };

    const handleNext = async () => {
        if (!name.trim() || !dateOfBirth || !gender) {
            return;
        }
        // Save progress to backend
        const lang = await AsyncStorage.getItem('user-language');

        await saveOnboardingProfile({
            name,
            dateOfBirth: dateOfBirth.toISOString(),
            gender,
            weight,
            conditions: [],
            caregivers: [],
            preferences: { reminderTimes: [], soundEnabled: true, vibrationEnabled: true, shareActivityWithCaregiver: true },
            isOnboardingCompleted: false,
            onboardingStep: 2,
            languages: lang ? [lang] : [],
        });
        router.push({
            pathname: '/(onboarding)/step2' as any,
            params: { name, dateOfBirth: dateOfBirth.toISOString(), gender, weight, phoneNumber }
        });
    };

    const isNextDisabled = !name.trim() || !dateOfBirth || !gender || !weight.trim();

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{t('onboarding.step1.title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step1.subtitle')}</Text>

                <View style={styles.formSection}>
                    <Text style={styles.label}>{t('onboarding.step1.fullName')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>Date of Birth</Text>
                    <TouchableOpacity
                        style={styles.input}
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.dobRow}>
                            <Text style={[styles.dobText, !dateOfBirth && styles.dobPlaceholder]}>
                                {dateOfBirth ? formatDate(dateOfBirth) : 'DD/MM/YYYY'}
                            </Text>
                            {dateOfBirth && (
                                <Text style={styles.ageHint}>{getAge(dateOfBirth)} years old</Text>
                            )}
                            <Ionicons name="calendar-outline" size={20} color="#999" />
                        </View>
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dateOfBirth || new Date()}
                            mode="date"
                            maximumDate={new Date()}
                            minimumDate={new Date(1920, 0, 1)}
                            onChange={(event, date) => {
                                setShowDatePicker(false);
                                if (date) setDateOfBirth(date);
                            }}
                        />
                    )}

                    <Text style={styles.label}>{t('onboarding.step1.weight')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 70"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="number-pad"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.label}>{t('onboarding.step1.gender')}</Text>
                    <View style={styles.genderContainer}>
                        {['Male', 'Female', 'Other'].map((g) => (
                            <TouchableOpacity
                                key={g}
                                style={[styles.genderButton, gender === g && styles.genderButtonActive]}
                                onPress={() => setGender(g)}
                            >
                                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, isNextDisabled && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={isNextDisabled}
                >
                    <LinearGradient
                        colors={isNextDisabled ? ['#e0e0e0', '#e0e0e0'] : ['#4CAF50', '#2E7D32']}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={[styles.nextButtonText, isNextDisabled && styles.nextButtonTextDisabled]}>{t('common.next')}</Text>
                        <Ionicons name="arrow-forward" size={20} color={isNextDisabled ? "#999" : "white"} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        gap: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dobRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dobText: {
        fontSize: 16,
        color: '#333',
    },
    dobPlaceholder: {
        color: '#999',
    },
    ageHint: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '600',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },

    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    genderButtonActive: {
        borderColor: '#4CAF50',
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
    },
    genderText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    genderTextActive: {
        color: '#4CAF50',
        fontWeight: '700',
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
