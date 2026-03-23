import React, { useState, useCallback, useEffect } from 'react';
import { saveOnboardingProfile, fetchCurrentUserProfile } from '../../services/api/profile';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lookupCaregiverByPhone } from '../../services/api/caregivers';
import '../../utils/i18n';

const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function Step3Screen() {
    const router = useRouter();
    const { t } = useTranslation();
    const params = useLocalSearchParams();

    // Params from previous steps
    const [name, setName] = useState(params.name as string || '');
    const [dateOfBirth, setDateOfBirth] = useState(params.dateOfBirth as string || '');
    const [gender, setGender] = useState(params.gender as string || '');
    const [weight, setWeight] = useState(params.weight as string || '');
    const [conditions, setConditions] = useState(params.conditions as string || ''); // JSON stringified
    const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber as string || '');

    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');

    // Pre-fill from saved profile if params are missing
    useEffect(() => {
      if (!name && !dateOfBirth) {
        fetchCurrentUserProfile().then((profile) => {
          if (profile?.name) setName(profile.name);
          if (profile?.dateOfBirth) setDateOfBirth(new Date(profile.dateOfBirth).toISOString());
          if (profile?.gender) setGender(profile.gender);
          if (profile?.weight != null) setWeight(String(profile.weight));
          if (profile?.phone) setPhoneNumber(profile.phone);
          if (profile?.conditions?.length) setConditions(JSON.stringify(profile.conditions));
          const caregiver = profile?.caregiverContacts?.[0];
          if (caregiver?.name) setEmergencyName(caregiver.name);
          if (caregiver?.phoneNumber) setEmergencyPhone(caregiver.phoneNumber);
          if (caregiver?.relation) setEmergencyRelation(caregiver.relation);
        }).catch(() => {});
      }
    }, []);

    // Phone validation & lookup state
    const [phoneError, setPhoneError] = useState('');
    const [lookupStatus, setLookupStatus] = useState<'idle' | 'checking' | 'found' | 'not-found'>('idle');
    const [isLookingUp, setIsLookingUp] = useState(false);

    const validateAndLookup = useCallback(async (phone: string) => {
        setEmergencyPhone(phone);
        setPhoneError('');
        setLookupStatus('idle');

        // Only digits
        const digits = phone.replace(/\D/g, '');

        if (digits.length === 0) {
            return;
        }

        if (digits.length < 10) {
            setPhoneError(t('onboarding.step3.validation.tooShort'));
            return;
        }

        if (digits.length > 10) {
            setPhoneError(t('onboarding.step3.validation.tooLong'));
            return;
        }

        if (!PHONE_REGEX.test(digits)) {
            setPhoneError(t('onboarding.step3.validation.invalidFormat'));
            return;
        }

        if (digits === phoneNumber) {
            setPhoneError(t('onboarding.step3.validation.sameAsUser'));
            return;
        }

        // Valid format — look up in system
        setIsLookingUp(true);
        setLookupStatus('checking');
        try {
            const result = await lookupCaregiverByPhone(digits);
            setLookupStatus(result.found ? 'found' : 'not-found');
        } catch {
            setLookupStatus('not-found');
        } finally {
            setIsLookingUp(false);
        }
    }, [phoneNumber, t]);

    const handleNext = async () => {
        // Block if phone is entered but invalid
        if (emergencyPhone.trim().length > 0 && phoneError) {
            return;
        }
        // Save progress to backend
        const lang = await AsyncStorage.getItem('user-language');
        await saveOnboardingProfile({
            name,
            dateOfBirth,
            gender,
            weight,
            conditions: conditions ? JSON.parse(conditions) : [],
            caregivers: emergencyName ? [{ name: emergencyName, phoneNumber: emergencyPhone, relation: emergencyRelation }] : [],
            preferences: { reminderTimes: [], soundEnabled: true, vibrationEnabled: true, shareActivityWithCaregiver: true },
            isOnboardingCompleted: false,
            onboardingStep: 4,
            languages: lang ? [lang] : [],
        });
        router.push({
            pathname: '/(onboarding)/step4' as any,
            params: {
                name,
                dateOfBirth,
                gender,
                weight,
                conditions,
                phoneNumber,
                emergencyName,
                emergencyPhone,
                emergencyRelation,
                caregiverVerified: lookupStatus === 'found' ? 'true' : 'false'
            }
        });
    };

    const hasCaregiverData = emergencyName.trim().length > 0 || emergencyPhone.trim().length > 0;
    const hasPhoneError = emergencyPhone.trim().length > 0 && phoneError.length > 0;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{t('onboarding.step3.title')}</Text>
                <Text style={styles.subtitle}>{t('onboarding.step3.subtitle')}</Text>

                <View style={styles.encouragementCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                    <Text style={styles.encouragementText}>{t('onboarding.step3.encouragement')}</Text>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionDivider}>{t('onboarding.step3.form.title')}</Text>

                    <Text style={styles.label}>{t('onboarding.step3.form.name')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Jane Doe"
                            value={emergencyName}
                            onChangeText={setEmergencyName}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <Text style={styles.label}>{t('onboarding.step3.form.phone')}</Text>
                    <View style={[
                        styles.inputContainer,
                        phoneError ? styles.inputContainerError : null,
                        lookupStatus === 'found' ? styles.inputContainerSuccess : null,
                        lookupStatus === 'not-found' ? styles.inputContainerWarning : null,
                    ]}>
                        <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 9876543211"
                            value={emergencyPhone}
                            onChangeText={validateAndLookup}
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholderTextColor="#999"
                        />
                        {isLookingUp && <ActivityIndicator size="small" color="#4CAF50" />}
                        {lookupStatus === 'found' && !isLookingUp && (
                            <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                        )}
                        {lookupStatus === 'not-found' && !isLookingUp && (
                            <Ionicons name="alert-circle" size={22} color="#F9A825" />
                        )}
                    </View>

                    {/* Phone validation error */}
                    {phoneError ? (
                        <View style={styles.feedbackRow}>
                            <Ionicons name="close-circle" size={16} color="#D32F2F" />
                            <Text style={styles.errorText}>{phoneError}</Text>
                        </View>
                    ) : null}

                    {/* Caregiver found */}
                    {lookupStatus === 'found' && !isLookingUp ? (
                        <View style={styles.feedbackRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={styles.successText}>{t('onboarding.step3.validation.found')}</Text>
                        </View>
                    ) : null}

                    {/* Caregiver not found — show warning + invite */}
                    {lookupStatus === 'not-found' && !isLookingUp ? (
                        <View style={styles.notFoundCard}>
                            <View style={styles.feedbackRow}>
                                <Ionicons name="alert-circle" size={16} color="#F57F17" />
                                <Text style={styles.warningText}>{t('onboarding.step3.validation.notFound')}</Text>
                            </View>
                            <Text style={styles.notFoundHint}>{t('onboarding.step3.validation.notFoundHint')}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.label}>{t('onboarding.step3.form.relation')}</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="people-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Spouse, Parent"
                            value={emergencyRelation}
                            onChangeText={setEmergencyRelation}
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, hasPhoneError && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={hasPhoneError || isLookingUp}
                >
                    <LinearGradient
                        colors={['#4CAF50', '#2E7D32']}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            {hasCaregiverData ? t('common.next') : t('onboarding.step3.skip')}
                        </Text>
                        <Ionicons 
                            name={hasCaregiverData ? "arrow-forward" : "play-skip-forward"} 
                            size={20} 
                            color="white" 
                        />
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
        marginBottom: 24,
        lineHeight: 24,
    },
    encouragementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        padding: 16,
        borderRadius: 12,
        marginBottom: 32,
        gap: 12,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    encouragementText: {
        flex: 1,
        fontSize: 14,
        color: '#2E7D32',
        lineHeight: 20,
        fontWeight: '500',
    },
    formSection: {
        gap: 16,
    },
    sectionDivider: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    inputContainerError: {
        borderColor: '#D32F2F',
        borderWidth: 1.5,
    },
    inputContainerSuccess: {
        borderColor: '#4CAF50',
        borderWidth: 1.5,
    },
    inputContainerWarning: {
        borderColor: '#F9A825',
        borderWidth: 1.5,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    errorText: {
        fontSize: 13,
        color: '#D32F2F',
    },
    successText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },
    warningText: {
        fontSize: 13,
        color: '#F57F17',
        fontWeight: '500',
    },
    notFoundCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FFE082',
    },
    notFoundHint: {
        fontSize: 12,
        color: '#795548',
        marginTop: 6,
        lineHeight: 18,
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
