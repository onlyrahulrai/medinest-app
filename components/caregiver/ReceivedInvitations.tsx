import React, { useEffect, useState, useCallback } from "react";
import InvitationService from "@/services/api/invitation";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Invitation {
    _id: string;
    sender?: {
        name?: string;
        phone?: string;
    };
    relation?: string;
    status?: string;
    createdAt?: string;
}

export default function ReceivedInvitations() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const fetchInvitations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await InvitationService.getInvitations({ type: "incoming", status: "pending" });
            setInvitations(data || []);
        } catch (error: any) {
            console.error("Failed to fetch invitations", error?.response?.data || error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvitations();
    }, [fetchInvitations]);

    const handleAcceptInvitation = async (invitationId: string) => {
        setActionLoadingId(invitationId);
        try {
            await InvitationService.respondToInvitation(invitationId, 'accept');
            // Optimistic removal
            setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
            Alert.alert("✅ Accepted", "You've accepted the caregiver request. They can now manage your medications.");
        } catch (error: any) {
            console.log("Error: ", error);
            Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to accept invitation");
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleRejectInvitation = (invitationId: string, senderName: string) => {
        Alert.alert(
            "Decline Request",
            `Are you sure you want to decline the request from ${senderName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Decline",
                    style: "destructive",
                    onPress: async () => {
                        setActionLoadingId(invitationId);
                        try {
                            await InvitationService.respondToInvitation(invitationId, 'reject');
                            // Optimistic removal
                            setInvitations(prev => prev.filter(inv => inv._id !== invitationId));
                        } catch (error: any) {
                            console.log("Error: --------> ", error)
                            Alert.alert("Error", error?.response?.data?.message || error?.message || "Failed to decline invitation");
                        } finally {
                            setActionLoadingId(null);
                        }
                    }
                }
            ]
        );
    };

    const getInitials = (name?: string) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const getTimeAgo = (dateString?: string) => {
        if (!dateString) return "";
        const diff = Date.now() - new Date(dateString).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return "Just now";
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days === 1) return "Yesterday";
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Caregiver Requests</Text>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#065F46" />
                    <Text style={styles.loadingText}>Loading requests...</Text>
                </View>
            </View>
        );
    }

    if (!invitations.length) return null;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconContainer}>
                        <Ionicons name="mail-unread" size={16} color="#D97706" />
                    </View>
                    <Text style={styles.sectionTitle}>Pending Requests</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{invitations.length}</Text>
                </View>
            </View>

            {invitations.map((inv, index) => {
                const isActionLoading = actionLoadingId === inv._id;
                return (
                    <View key={inv._id} style={[styles.invitationCard, index > 0 && { marginTop: 12 }]}>
                        <View style={styles.cardGlow} />
                        <View style={styles.cardContent}>
                            {/* Header Row */}
                            <View style={styles.cardHeader}>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient
                                        colors={['#FCD34D', '#F59E0B']}
                                        style={styles.avatar}
                                    >
                                        <Text style={styles.avatarText}>{getInitials(inv.sender?.name)}</Text>
                                    </LinearGradient>
                                    <View style={styles.statusDot} />
                                </View>
                                <View style={styles.infoContainer}>
                                    <Text style={styles.senderName} numberOfLines={1}>
                                        {inv.sender?.name || "Unknown"}
                                    </Text>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                                        <Text style={styles.phoneText}>{inv.sender?.phone || "N/A"}</Text>
                                    </View>
                                </View>
                                <View style={styles.timeBadge}>
                                    <Ionicons name="time-outline" size={11} color="#9CA3AF" />
                                    <Text style={styles.timeText}>{getTimeAgo(inv.createdAt)}</Text>
                                </View>
                            </View>

                            {/* Relation & Status */}
                            {inv.relation && (
                                <View style={styles.relationContainer}>
                                    <View style={styles.relationBadge}>
                                        <Ionicons name="heart-outline" size={11} color="#6B7280" />
                                        <Text style={styles.relationText}>{inv.relation}</Text>
                                    </View>
                                    <View style={styles.pendingBadge}>
                                        <View style={styles.pendingDot} />
                                        <Text style={styles.pendingText}>{inv.status?.toUpperCase() || "PENDING"}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Description */}
                            <Text style={styles.requestDescription}>
                                wants to be added as your caregiver to help manage your medications.
                            </Text>

                            {/* Action Buttons */}
                            <View style={styles.actionsRow}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.declineButton]}
                                    onPress={() => handleRejectInvitation(inv._id, inv.sender?.name || "this person")}
                                    disabled={isActionLoading}
                                    activeOpacity={0.7}
                                >
                                    {isActionLoading && actionLoadingId === inv._id ? (
                                        <ActivityIndicator size="small" color="#EF4444" />
                                    ) : (
                                        <>
                                            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                                            <Text style={styles.declineButtonText}>Decline</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.acceptButton]}
                                    onPress={() => handleAcceptInvitation(inv._id)}
                                    disabled={isActionLoading}
                                    activeOpacity={0.7}
                                >
                                    {isActionLoading && actionLoadingId === inv._id ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <LinearGradient
                                            colors={['#059669', '#047857']}
                                            style={styles.acceptGradient}
                                        >
                                            <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                                            <Text style={styles.acceptButtonText}>Accept</Text>
                                        </LinearGradient>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    countBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        gap: 10,
    },
    loadingText: {
        color: '#6B7280',
        fontSize: 14,
    },
    invitationCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    cardGlow: {
        height: 3,
        backgroundColor: '#FCD34D',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FBBF24',
        borderWidth: 2.5,
        borderColor: '#FFFFFF',
    },
    infoContainer: {
        flex: 1,
    },
    senderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.2,
        marginBottom: 3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    relationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
    },
    relationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    relationText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    pendingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
    },
    pendingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#D97706',
    },
    requestDescription: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 10,
        lineHeight: 18,
        fontStyle: 'italic',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    actionButton: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        flexDirection: 'row',
        gap: 6,
    },
    declineButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EF4444',
    },
    acceptButton: {
        backgroundColor: '#059669',
    },
    acceptGradient: {
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    acceptButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});