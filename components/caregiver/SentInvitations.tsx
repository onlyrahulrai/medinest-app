import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import InvitationService from "@/services/api/invitation";

const Invitation_Status: any = {
    pending: "Pending",
    accepted: "Connected",
    rejected: "Rejected",
    expired: "Expired",
};

export default function SentInvitations() {
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(false);

    const getCaregivers = async () => {
        setLoading(true);
        try {
            const caregivers = await InvitationService.getInvitations({ type: "sent" });

            setCaregivers(caregivers);
        } catch (error: any) {
            console.error("Failed to fetch caregivers", error.response.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCaregivers();
    }, []);

    const handleResendInvitation = async (caregiver: any) => {
        console.log("Caregiver Id: ", caregiver?._id);

        try {
            await InvitationService.resendInvitation(caregiver._id);


            Alert.alert("✅ Invitation Resent", "Invitation has been resent to the caregiver.");
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to resend invitation");
        }
    };

    const handleRemoveCaregiver = async (caregiverName: string, caregiverId: string) => {
        try {
            await InvitationService.deleteInvitation(caregiverId);
            Alert.alert("✅ Caregiver Removed", "Caregiver has been removed successfully.");
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to remove caregiver");
        }
    };

    return (
        <View style={styles.card}>
            {caregivers && caregivers.length > 0 ? (
                caregivers.map((caregiver: any, index: number) => (
                    <View key={caregiver.id || index} style={[styles.row, index > 0 && styles.rowBorder]}>
                        <View style={[styles.icon, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="person-outline" size={22} color="#666" />
                        </View>
                        <View style={styles.rowContent}>
                            <View style={styles.emergencyHeader}>
                                <Text style={styles.rowText}>{caregiver.caregiverName}</Text>
                                <View style={styles.actionButtons}>
                                    {caregiver.status !== 'accepted' && (
                                        <TouchableOpacity
                                            onPress={() => handleResendInvitation(caregiver)}
                                            style={styles.resendBtn}
                                        >
                                            <Ionicons name="refresh-outline" size={18} color="#4CAF50" />
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        onPress={() => handleRemoveCaregiver(caregiver.caregiverName, caregiver._id)}
                                        style={styles.removeBtn}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#f44336" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <View style={styles.caregiverMeta}>
                                <Text style={styles.rowSubText}>{caregiver.receiverPhone} • {caregiver.relation}</Text>
                                <View style={[
                                    styles.statusBadge,
                                    caregiver.status === 'accepted' ? styles.statusAccepted :
                                        caregiver.status === 'rejected' ? styles.statusRejected :
                                            styles.statusPending
                                ]}>
                                    <Text style={[
                                        styles.statusText,
                                        caregiver.status === 'accepted' ? styles.statusTextAccepted :
                                            caregiver.status === 'rejected' ? styles.statusTextRejected :
                                                styles.statusTextPending
                                    ]}>
                                        {Invitation_Status[caregiver.status]}
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
    );
}

const styles = StyleSheet.create({
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
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    resendBtn: {
        padding: 4,
    },
    removeBtn: {
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
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 10,
    },
});
