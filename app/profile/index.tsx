import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile, UserProfile, saveUserProfile } from '../../utils/storage';

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showAddCaregiver, setShowAddCaregiver] = useState(false);
    const [newCaregiverName, setNewCaregiverName] = useState("");
    const [newCaregiverPhone, setNewCaregiverPhone] = useState("");
    const [newCaregiverRelation, setNewCaregiverRelation] = useState("");

    const [isLoading, setIsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        setIsLoading(true);
        const data = await getUserProfile();
        setProfile(data);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={["#065F46", "#064E3B"]}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>Loading profile...</Text>
                </View>
            </View>
        );
    }

    const handleAddCaregiver = async () => {
        if (!newCaregiverName || !newCaregiverPhone || !profile) return;

        const newCaregiver = {
            id: Math.random().toString(36).substr(2, 9),
            name: newCaregiverName,
            phoneNumber: newCaregiverPhone,
            relation: newCaregiverRelation || "Other"
        };

        const updatedProfile = {
            ...profile,
            caregivers: [...(profile.caregivers || []), newCaregiver]
        };

        await saveUserProfile(updatedProfile);
        setProfile(updatedProfile);
        setShowAddCaregiver(false);
        setNewCaregiverName("");
        setNewCaregiverPhone("");
        setNewCaregiverRelation("");
    };

    if (!profile) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={["#065F46", "#064E3B"]}
                    style={styles.header}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Ionicons name="person-circle-outline" size={80} color="#ccc" />
                    <Text style={{ fontSize: 18, fontWeight: '600', color: '#666', marginTop: 16 }}>No Profile Found</Text>
                    <Text style={{ textAlign: 'center', color: '#999', marginTop: 8 }}>Please complete your setup to view your profile.</Text>
                    <TouchableOpacity
                        style={{ marginTop: 24, backgroundColor: '#065F46', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
                        onPress={() => router.push('/(onboarding)/step1')}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Setup Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#065F46", "#064E3B"]}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Profile</Text>
                    <TouchableOpacity onPress={() => router.push('/profile/edit')} style={styles.iconButton}>
                        <Ionicons name="pencil" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scrollContent}
                bounces={true}
            >
                <View style={styles.avatarSection}>
                    <View style={styles.avatarPlaceholder}>
                        {profile.image ? (
                            <Image source={{ uri: profile.image }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                    <Text style={styles.name}>{profile.name}</Text>
                    <Text style={styles.subText}>{(() => {
                        const dob = new Date(profile.dateOfBirth);
                        const today = new Date();
                        let age = today.getFullYear() - dob.getFullYear();
                        const m = today.getMonth() - dob.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                        return `${age} years`;
                    })()} • {profile.gender} • {profile.weight} kg</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons name="call-outline" size={22} color="#666" style={styles.icon} />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Phone Number</Text>
                                <Text style={styles.rowText}>{profile.phoneNumber}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Caregivers</Text>
                        <TouchableOpacity onPress={() => setShowAddCaregiver(true)}>
                            <Text style={styles.addCaregiverBtn}>+ Add</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.card}>
                        {profile.caregivers && profile.caregivers.length > 0 ? (
                            profile.caregivers.map((caregiver, index) => (
                                <View key={caregiver.id || index} style={[styles.row, index > 0 && styles.rowBorder]}>
                                    <View style={[styles.icon, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="people-outline" size={22} color="#f44336" />
                                    </View>
                                    <View style={styles.rowContent}>
                                        <View style={styles.emergencyHeader}>
                                            <Text style={styles.rowText}>{caregiver.name}</Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    Alert.alert(
                                                        "Remove Caregiver",
                                                        `Are you sure you want to remove ${caregiver.name}? they will no longer be able to manage your medications.`,
                                                        [
                                                            { text: "Cancel", style: "cancel" },
                                                            {
                                                                text: "Remove",
                                                                style: "destructive",
                                                                onPress: async () => {
                                                                    const updatedCaregivers = profile.caregivers.filter(c => c.id !== caregiver.id);
                                                                    const updatedProfile = { ...profile, caregivers: updatedCaregivers };
                                                                    await saveUserProfile(updatedProfile);
                                                                    setProfile(updatedProfile);
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                                style={styles.removeBtn}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#f44336" />
                                            </TouchableOpacity>
                                        </View>
                                        <View style={styles.emergencyHeader}>
                                            <View style={styles.relationChip}>
                                                <Text style={styles.relationText}>{caregiver.relation}</Text>
                                            </View>
                                            <Text style={styles.rowSubText}>{caregiver.phoneNumber}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No caregivers added.</Text>
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Health Conditions</Text>
                    <View style={styles.card}>
                        {profile.conditions && profile.conditions.length > 0 ? (
                            <View style={styles.conditionsGrid}>
                                {profile.conditions.map((condition, index) => (
                                    <View key={index} style={styles.conditionChip}>
                                        <Text style={styles.conditionChipText}>{condition}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.emptyText}>No existing conditions reported.</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/settings')}
                >
                    <Ionicons name="settings-outline" size={24} color="#333" />
                    <Text style={styles.settingsButtonText}>Preferences & Settings</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={showAddCaregiver} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add Caregiver</Text>
                            <TouchableOpacity onPress={() => setShowAddCaregiver(false)}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput style={styles.modalInput} placeholder="e.g. Jane Doe" value={newCaregiverName} onChangeText={setNewCaregiverName} placeholderTextColor="#999" />

                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput style={styles.modalInput} placeholder="e.g. 9876543210" value={newCaregiverPhone} onChangeText={setNewCaregiverPhone} keyboardType="phone-pad" placeholderTextColor="#999" />

                        <Text style={styles.inputLabel}>Relation</Text>
                        <TextInput style={styles.modalInput} placeholder="e.g. Spouse" value={newCaregiverRelation} onChangeText={setNewCaregiverRelation} placeholderTextColor="#999" />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddCaregiver}>
                            <Text style={styles.saveBtnText}>Save Caregiver</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 16,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    scrollView: {
        flex: 1,
    },
    iconButton: {
        padding: 8,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 150,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: 24,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subText: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        marginLeft: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rowBorder: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
        paddingTop: 16,
    },
    icon: {
        width: 40,
        textAlign: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    rowText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    rowSubText: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    emergencyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    relationChip: {
        backgroundColor: '#FFF0F0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    relationText: {
        color: '#f44336',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    conditionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    conditionChip: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    conditionChipText: {
        color: '#444',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 10,
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    settingsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 12,
    },
    // Caregiver Styles
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginLeft: 4,
        marginRight: 4,
    },
    addCaregiverBtn: {
        color: '#4CAF50',
        fontWeight: '600',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    saveBtn: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    removeBtn: {
        padding: 4,
    }
});
