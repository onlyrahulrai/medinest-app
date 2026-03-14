import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Step3Screen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Params from previous steps
    const name = params.name as string;
    const age = params.age as string;
    const gender = params.gender as string;
    const conditions = params.conditions as string; // JSON stringified

    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyPhone, setEmergencyPhone] = useState('');
    const [emergencyRelation, setEmergencyRelation] = useState('');

    const handleNext = () => {
        router.push({
            pathname: '/(onboarding)/step4' as any,
            params: {
                name,
                age,
                gender,
                conditions,
                emergencyName,
                emergencyPhone,
                emergencyRelation
            }
        });
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Caregiver Details</Text>
                <Text style={styles.subtitle}>Please provide the details of your primary caregiver who helps manage your medications.</Text>

                <View style={styles.formSection}>
                    <Text style={styles.sectionDivider}>Primary Caregiver (Optional)</Text>

                    <Text style={styles.label}>Name</Text>
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

                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 9876543211"
                            value={emergencyPhone}
                            onChangeText={setEmergencyPhone}
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <Text style={styles.label}>Relation</Text>
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
                    style={[styles.nextButton, styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={false}
                >
                    <LinearGradient
                        colors={false ? ['#e0e0e0', '#e0e0e0'] : ['#4CAF50', '#2E7D32']}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={[styles.nextButtonText, false ? styles.nextButtonTextDisabled : null]}>Next Step</Text>
                        <Ionicons name="arrow-forward" size={20} color={false ? "#999" : "white"} />
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
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
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
