import { caregiverApi } from "@/services/api/caregiverApi";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ReceivedInvitations() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(false);

    const getCaregivers = async () => {
        setLoading(true);
        try {
            const invitations = await caregiverApi.getInvitations({ type: "incoming" });

            setInvitations(invitations);
        } catch (error: any) {
            console.error("Failed to fetch caregivers", error.response.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getCaregivers();
    }, []);

    const handleRejectInvitation = (caregiver: any) => {
        console.log("Resend invitation to", caregiver);
    };

    const handleAcceptInvitation = (caregiverId: string) => {
        console.log("Remove caregiver", caregiverId);
    };

    return invitations.length ? (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Caregiver Requests</Text>
            {invitations.map((inv: any) => (
                <View key={inv._id} style={styles.caregiverCard}>
                    <View style={styles.caregiverInfo}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person-outline" size={22} color="#666" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.caregiverName}>{inv.sender?.name}</Text>
                            <Text style={styles.caregiverRelation}>{inv.sender?.phone}</Text>
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
    ) : null;
}

const styles = StyleSheet.create({
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 50,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
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
    caregiverCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    caregiverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
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
});