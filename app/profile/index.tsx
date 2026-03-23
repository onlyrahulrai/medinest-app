import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '../../utils/storage';
import { fetchCurrentUserProfile, mapRemoteProfileToLocalProfile } from '../../services/api/profile';
import { upsertInvitation, removeCaregiver as removeCaregiverApi, lookupCaregiverByPhone, getInvitations, respondToInvitation } from '../../services/api/caregivers';

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showAddCaregiver, setShowAddCaregiver] = useState(false);
    const [newCaregiverName, setNewCaregiverName] = useState("");
    const [newCaregiverPhone, setNewCaregiverPhone] = useState("");
    const [newCaregiverRelation, setNewCaregiverRelation] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
            loadInvitations();
        }, [])
    );

    const loadInvitations = async () => {
        try {
            const data = await getInvitations(profile?.phoneNumber || "");
            setPendingInvitations(data);
        } catch (error) {
            console.error("Failed to load invitations", error);
        }
    };

    const loadProfile = async () => {
        setIsLoading(true);
        try {
            const remoteProfile = await fetchCurrentUserProfile();
            const localProfile = mapRemoteProfileToLocalProfile(remoteProfile);
            setProfile(localProfile);
            
            // Also load invitations once we have the phone number
            if (localProfile.phoneNumber) {
                const invs = await getInvitations(localProfile.phoneNumber);
                setPendingInvitations(invs);
            }
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitationId: string) => {
        setIsActionLoading(true);
        try {
            await respondToInvitation(invitationId, 'accepted');
            Alert.alert("Success", "Invitation accepted.");
            loadProfile();
            loadInvitations();
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to accept");
        } finally {
            setIsActionLoading(true);
        }
    };

    const handleRejectInvitation = async (invitationId: string) => {
        Alert.alert(
            "Decline Request",
            "Are you sure you want to decline this request?",
            [
                { text: "Cancel", style: 'cancel' },
                {
                    text: "Decline",
                    style: 'destructive',
                    onPress: async () => {
                        setIsActionLoading(true);
                        try {
                            await respondToInvitation(invitationId, 'rejected');
                            loadInvitations();
                        } catch (error: any) {
                            Alert.alert("Error", error?.message || "Failed to decline");
                        } finally {
                            setIsActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleAddCaregiver = async () => {
        if (!newCaregiverPhone || !profile) return;
        
        setIsActionLoading(true);
        try {
            // First lookup to see if they exist
            const lookup = await lookupCaregiverByPhone(newCaregiverPhone);
            
            await upsertInvitation({
                name: newCaregiverName || lookup.name,
                phoneNumber: newCaregiverPhone,
                relation: newCaregiverRelation || "Other"
            });
            
            Alert.alert("Success", "Caregiver invitation has been sent/updated.");
            setShowAddCaregiver(false);
            setNewCaregiverName("");
            setNewCaregiverPhone("");
            setNewCaregiverRelation("");
            loadProfile();
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to add caregiver");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRemoveCaregiver = (name: string, phoneNumber: string) => {
        Alert.alert(
            "Remove Caregiver",
            `Are you sure you want to remove ${name}? they will no longer be able to manage your medications.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeCaregiverApi(phoneNumber);
                            loadProfile();
                        } catch (error: any) {
                            Alert.alert("Error", error?.message || "Failed to remove caregiver");
                        }
                    }
                }
            ]
        );
    };

    const handleResendInvitation = async (caregiver: any) => {
        try {
            await upsertInvitation({
                name: caregiver.name,
                phoneNumber: caregiver.phoneNumber,
                relation: caregiver.relation
            });
            Alert.alert("Success", "Invitation resent successfully.");
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to resend invitation");
        }
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
                    <ActivityIndicator size="large" color="#065F46" />
                    <Text style={{ color: '#666', marginTop: 12 }}>Loading profile...</Text>
                </View>
            </View>
        );
    }

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
                        <Text style={styles.sectionTitle}>Caregiver Status</Text>
                        <TouchableOpacity onPress={() => setShowAddCaregiver(true)}>
                            <Text style={styles.addCaregiverBtn}>+ Invite New</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.card}>
                        {profile.caregivers && profile.caregivers.length > 0 ? (
                            profile.caregivers.map((caregiver, index) => (
                                <View key={caregiver.id || index} style={[styles.row, index > 0 && styles.rowBorder]}>
                                    <View style={[styles.icon, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="person-outline" size={22} color="#666" />
                                    </View>
                                    <View style={styles.rowContent}>
                                        <View style={styles.emergencyHeader}>
                                            <Text style={styles.rowText}>{caregiver.name}</Text>
                                            <View style={styles.actionButtons}>
                                                {caregiver.inviteStatus !== 'accepted' && (
                                                    <TouchableOpacity
                                                        onPress={() => handleResendInvitation(caregiver)}
                                                        style={styles.resendBtn}
                                                    >
                                                        <Ionicons name="refresh-outline" size={18} color="#4CAF50" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    onPress={() => handleRemoveCaregiver(caregiver.name, caregiver.phoneNumber)}
                                                    style={styles.removeBtn}
                                                >
                                                    <Ionicons name="trash-outline" size={18} color="#f44336" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <View style={styles.caregiverMeta}>
                                            <Text style={styles.rowSubText}>{caregiver.phoneNumber} • {caregiver.relation}</Text>
                                            <View style={[
                                                styles.statusBadge,
                                                caregiver.inviteStatus === 'accepted' ? styles.statusAccepted :
                                                caregiver.inviteStatus === 'rejected' ? styles.statusRejected :
                                                styles.statusPending
                                            ]}>
                                                <Text style={[
                                                    styles.statusText,
                                                    caregiver.inviteStatus === 'accepted' ? styles.statusTextAccepted :
                                                    caregiver.inviteStatus === 'rejected' ? styles.statusTextRejected :
                                                    styles.statusTextPending
                                                ]}>
                                                    {caregiver.inviteStatus === 'accepted' ? "Caregiver Connected" :
                                                     caregiver.inviteStatus === 'rejected' ? "Request Declined" :
                                                     "Invitation Sent"}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={40} color="#ccc" />
                                <Text style={styles.emptyText}>No caregivers added yet.</Text>
                            </View>
                        )}
                    </View>
                </View>
                {/* Pending Caregiver Requests */}
                {pendingInvitations.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Pending Caregiver Requests</Text>
                        {pendingInvitations.map((inv) => (
                            <View key={inv._id} style={styles.caregiverCard}>
                                <View style={styles.caregiverInfo}>
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>{inv.senderName?.charAt(0)}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.caregiverName}>{inv.senderName}</Text>
                                        <Text style={styles.caregiverRelation}>{inv.senderPhone}</Text>
                                    </View>
                                </View>
                                <View style={styles.invitationActions}>
                                    <TouchableOpacity 
                                        style={[styles.smallActionBtn, styles.declineBtn]}
                                        onPress={() => handleRejectInvitation(inv._id)}
                                    >
                                        <Text style={styles.declineBtnText}>Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.smallActionBtn, styles.acceptBtn]}
                                        onPress={() => handleAcceptInvitation(inv._id)}
                                    >
                                        <Text style={styles.acceptBtnText}>Accept</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* People I Care For */}
                {(profile?.managedPatients?.length ?? 0) > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>People I Care For</Text>
                        {profile?.managedPatients.map((patient) => (
                            <View key={patient.id} style={styles.caregiverCard}>
                                <View style={styles.caregiverInfo}>
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: '#E0F2FE' }]}>
                                        <Text style={[styles.avatarText, { color: '#0369A1' }]}>{patient.name.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.caregiverName}>{patient.name}</Text>
                                        <Text style={styles.caregiverRelation}>{patient.phoneNumber}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.manageBtn}
                                    onPress={() => router.push({ pathname: '/caregiver/activity', params: { patientId: patient.id, name: patient.name } })}
                                >
                                    <Text style={styles.manageBtnText}>View Activity</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {/* App Settings */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <Text style={styles.sectionTitle}>App Settings</Text>
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

                        <TouchableOpacity 
                            style={[styles.saveBtn, (!newCaregiverPhone || isActionLoading) && styles.saveBtnDisabled]} 
                            onPress={handleAddCaregiver}
                            disabled={!newCaregiverPhone || isActionLoading}
                        >
                            {isActionLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Caregiver</Text>}
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
    },
    removeBtnText: {
        color: '#DC2626',
        fontSize: 12,
        fontWeight: '600',
    },
    caregiverCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    caregiverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    caregiverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    caregiverRelation: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    invitationActions: {
        flexDirection: 'row',
        gap: 8,
    },
    smallActionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    declineBtn: {
        backgroundColor: '#FEE2E2',
    },
    acceptBtn: {
        backgroundColor: '#065F46',
    },
    declineBtnText: {
        color: '#DC2626',
        fontSize: 12,
        fontWeight: 'bold',
    },
    acceptBtnText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    manageBtn: {
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    manageBtnText: {
        color: '#0369A1',
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    resendBtn: {
        padding: 4,
    },
    caregiverMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusPending: {
        backgroundColor: '#FFF8E1',
    },
    statusAccepted: {
        backgroundColor: '#E8F5E9',
    },
    statusRejected: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statusTextPending: {
        color: '#F57F17',
    },
    statusTextAccepted: {
        color: '#2E7D32',
    },
    statusTextRejected: {
        color: '#D32F2F',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    saveBtnDisabled: {
        backgroundColor: '#ccc',
    }
});
