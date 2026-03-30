import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useDeleteCaregiver } from '../../hooks/useCaregiverHooks';
import { openAddCaregiverSheet } from '../../utils/events';
import { useSelector } from 'react-redux';
import SentInvitations from '@/components/caregiver/SentInvitations';
import ReceivedInvitations from '@/components/caregiver/ReceivedInvitations';
import ManagedPatients from '@/components/caregiver/ManagedPatients';
import ProfileRoutinesSection from '@/components/profile/ProfileRoutinesSection';
import LanguageSelector from '@/components/profile/LanguageSelector';

export default function ProfileScreen() {
    const router = useRouter();
    const user = useSelector((state: any) => state.auth.user);
    const [isLoading, setIsLoading] = useState(false);

    const { deleteCaregiver } = useDeleteCaregiver();

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
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={{ color: '#666', marginTop: 12 }}>Loading profile...</Text>
                </View>
            </View>
        );
    }

    if (!user) {
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
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarPlaceholder}>
                        {user?.profile?.pic ? (
                            <Image source={{ uri: user.profile.pic }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
                        )}
                    </View>
                    <Text style={styles.name}>{user.name}</Text>
                    <Text style={styles.subText}>{(() => {
                        const dob = new Date(user.profile.dateOfBirth);
                        const today = new Date();
                        let age = today.getFullYear() - dob.getFullYear();
                        const m = today.getMonth() - dob.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
                        return `${age} years`;
                    })()} • {user?.profile?.gender} • {user?.profile?.weight} kg</Text>
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="call" size={14} color="#059669" />
                            </View>
                            <Text style={styles.sectionTitle}>Contact Information</Text>
                        </View>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons name="call-outline" size={22} color="#666" style={styles.icon} />
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Phone Number</Text>
                                <Text style={styles.rowText}>{user.phone}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Caregiver Status (Sent Invitations) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#F0FDF4' }]}>
                                <Ionicons name="people" size={14} color="#059669" />
                            </View>
                            <Text style={styles.sectionTitle}>Caregiver Status</Text>
                        </View>
                        <TouchableOpacity
                            onPress={openAddCaregiverSheet}
                            style={styles.inviteButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle-outline" size={16} color="#059669" />
                            <Text style={styles.inviteButtonText}>Invite New</Text>
                        </TouchableOpacity>
                    </View>
                    <SentInvitations />
                </View>

                {/* Pending Caregiver Requests */}
                <ReceivedInvitations />

                {/* People I Care For */}
                <ManagedPatients />

                {/* Routines Section */}
                <ProfileRoutinesSection />

                {/* Language Section */}
                <LanguageSelector />

                {/* Health Conditions */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="fitness" size={14} color="#EF4444" />
                            </View>
                            <Text style={styles.sectionTitle}>Health Conditions</Text>
                        </View>
                    </View>
                    <View style={styles.card}>
                        {user?.profile?.conditions && user?.profile?.conditions.length > 0 ? (
                            <View style={styles.conditionsGrid}>
                                {user?.profile?.conditions.map((condition: string, index: number) => (
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

                {/* Settings Button */}
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/settings')}
                    activeOpacity={0.7}
                >
                    <View style={[styles.sectionIconContainer, { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons name="settings-outline" size={16} color="#6B7280" />
                    </View>
                    <Text style={styles.settingsButtonText}>Preferences & Settings</Text>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
            </ScrollView>
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
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        marginLeft: 4,
        marginRight: 4,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    inviteButtonText: {
        color: '#059669',
        fontWeight: '600',
        fontSize: 13,
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
        gap: 12,
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
    },
});
