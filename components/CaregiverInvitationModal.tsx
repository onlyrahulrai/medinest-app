import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InvitationService from '../services/api/invitation';
import { getUserProfile } from '../utils/storage';
import { useFocusEffect } from 'expo-router';

export default function CaregiverInvitationModal() {
    const [invitation, setInvitation] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const checkInvitations = async () => {
        try {
            const profile = await getUserProfile();

            if (!profile?.phoneNumber) return;

            const invitations = await InvitationService.getInvitations({ type: "incoming" });

            if (invitations && invitations.length > 0) {
                setInvitation(invitations[0]); // Show the first one
                setIsVisible(true);
            } else {
                setIsVisible(false);
                setInvitation(null);
            }
        } catch (error) {
            console.error("Failed to check invitations", error);
        }
    };

    // useEffect(() => {
    //     const interval = setInterval(checkInvitations, 60000); // Check every minute
    //     checkInvitations();
    //     return () => clearInterval(interval);
    // }, []);

    const handleResponse = async (status: 'accepted' | 'rejected') => {
        if (!invitation) return;
        setLoading(true);
        try {
            await invitation.respondToInvitation(invitation._id, status);
            Alert.alert("Success", status === 'accepted' ? "You have accepted the invite." : "Invitation declined.");
            setIsVisible(false);
            setInvitation(null);
            // Optionally refresh another component if needed
        } catch (error: any) {
            Alert.alert("Error", error?.message || "Failed to respond to invitation");
        } finally {
            setLoading(false);
        }
    };

    if (!invitation) return null;

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="people-outline" size={48} color="#065F46" />
                    </View>
                    <Text style={styles.title}>Caregiver Request Received</Text>
                    <Text style={styles.message}>
                        <Text style={{ fontWeight: 'bold' }}>{invitation.senderName}</Text> ({invitation.senderPhone}) has requested you to be their caregiver.
                    </Text>
                    {invitation.message && (
                        <View style={styles.inviteMessageContainer}>
                            <Text style={styles.inviteMessage}>"{invitation.message}"</Text>
                        </View>
                    )}

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.rejectButton]}
                            onPress={() => handleResponse('rejected')}
                            disabled={loading}
                        >
                            <Text style={styles.rejectText}>Decline</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.acceptButton]}
                            onPress={() => handleResponse('accepted')}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.acceptText}>Accept</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E6FFFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    inviteMessageContainer: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        width: '100%',
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#065F46',
    },
    inviteMessage: {
        fontStyle: 'italic',
        color: '#444',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#FEE2E2',
    },
    acceptButton: {
        backgroundColor: '#065F46',
    },
    rejectText: {
        color: '#DC2626',
        fontWeight: 'bold',
    },
    acceptText: {
        color: 'white',
        fontWeight: 'bold',
    }
});
