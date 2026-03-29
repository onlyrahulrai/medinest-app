import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCaregivers, useAddCaregiver, useDeleteCaregiver, useRespondInvitation, useCheckUserExists } from '../../hooks/useCaregiverHooks';
import { useSelector } from 'react-redux';
import SentInvitations from '@/components/caregiver/SentInvitations';
import ReceivedInvitations from '@/components/caregiver/ReceivedInvitations';
import ManagedPatients from '@/components/caregiver/ManagedPatients';

export default function ProfileScreen() {
    const router = useRouter();
    const user = useSelector((state: any) => state.auth.user);
    const [showAddCaregiver, setShowAddCaregiver] = useState(false);
    const [newCaregiverName, setNewCaregiverName] = useState("");
    const [newCaregiverPhone, setNewCaregiverPhone] = useState("");
    const [newCaregiverRelation, setNewCaregiverRelation] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

    const { addCaregiver } = useAddCaregiver();
    const { deleteCaregiver } = useDeleteCaregiver();
    const { respondInvitation } = useRespondInvitation();
    const { data: caregiversList, refetch: refetchCaregivers } = useCaregivers();
    const { checkUser, isExistingUser, existsName, isLookupLoading } = useCheckUserExists();

    const handleAcceptInvitation = async (invitationId: string) => {
        setIsActionLoading(true);
        try {
            await respondInvitation(invitationId, 'accepted');
            Alert.alert("Success", "Invitation accepted.");
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to accept");
        } finally {
            setIsActionLoading(false);
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
                            await respondInvitation(invitationId, 'rejected');
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
        if (!newCaregiverPhone) return;

        setIsActionLoading(true);
        try {
            await addCaregiver({
                caregiverName: newCaregiverName || existsName,
                caregiverPhone: newCaregiverPhone,
                relation: newCaregiverRelation || "Other"
            });

            Alert.alert("Success", "Caregiver invitation has been sent/updated.");
            setShowAddCaregiver(false);
            setNewCaregiverName("");
            setNewCaregiverPhone("");
            setNewCaregiverRelation("");
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to add caregiver");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRemoveCaregiver = (name: string, relationId: string) => {
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
                            await deleteCaregiver(relationId);
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
            await addCaregiver({
                caregiverName: caregiver.name,
                caregiverPhone: caregiver.phoneNumber,
                relation: caregiver.relation || "Other"
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

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
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

                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Caregiver Status</Text>
                        <TouchableOpacity onPress={() => setShowAddCaregiver(true)}>
                            <Text style={styles.addCaregiverBtn}>+ Invite New</Text>
                        </TouchableOpacity>
                    </View>

                    <SentInvitations />
                </View>

                {/* Pending Caregiver Requests */}
                <ReceivedInvitations />

                {/* People I Care For */}
                <ManagedPatients />

                {/* App Settings */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <Text style={styles.sectionTitle}>App Settings</Text>
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
                        <TextInput style={styles.modalInput} placeholder="e.g. 9876543210" value={newCaregiverPhone} onChangeText={(text) => { setNewCaregiverPhone(text); checkUser(text); }} keyboardType="phone-pad" placeholderTextColor="#999" />

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
