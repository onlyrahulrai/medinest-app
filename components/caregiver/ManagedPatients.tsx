import RelationService from "@/services/api/relation";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface Patient {
    _id: string;
    user: {
        id?: string;
        name: string;
        phone: string;
    };
    relation?: string;
}

export default function ManagedPatients() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const getCaregiverRelations = useCallback(async () => {
        setLoading(true);
        try {
            const data = await RelationService.getRelations({ role: "caregiver" });
            setPatients(data || []);
        } catch (error: any) {
            console.error("Failed to fetch patients", error?.response?.data || error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getCaregiverRelations();
    }, [getCaregiverRelations]);

    const getInitials = (name: string) => {
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const avatarColors: string[][] = [
        ['#6366F1', '#4F46E5'],
        ['#06B6D4', '#0891B2'],
        ['#8B5CF6', '#7C3AED'],
        ['#EC4899', '#DB2777'],
        ['#14B8A6', '#0D9488'],
    ];

    if (loading) {
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>People I Care For</Text>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#065F46" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    if (!patients.length) return null;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconContainer}>
                        <Ionicons name="heart" size={14} color="#EC4899" />
                    </View>
                    <Text style={styles.sectionTitle}>People I Care For</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{patients.length}</Text>
                </View>
            </View>

            {patients.map((patient, index) => {
                const colors = avatarColors[index % avatarColors.length];
                return (
                    <View key={patient._id} style={[styles.patientCard, index > 0 && { marginTop: 12 }]}>
                        <View style={styles.cardContent}>
                            <View style={styles.patientInfo}>
                                <LinearGradient
                                    colors={colors as [string, string]}
                                    style={styles.avatar}
                                >
                                    <Text style={styles.avatarText}>{getInitials(patient.user.name)}</Text>
                                </LinearGradient>
                                <View style={styles.infoContainer}>
                                    <Text style={styles.patientName} numberOfLines={1}>{patient.user.name}</Text>
                                    <View style={styles.metaRow}>
                                        <Ionicons name="call-outline" size={12} color="#9CA3AF" />
                                        <Text style={styles.phoneText}>{patient.user.phone}</Text>
                                    </View>
                                    {patient.relation && (
                                        <View style={styles.relationBadge}>
                                            <Ionicons name="heart-outline" size={10} color="#6B7280" />
                                            <Text style={styles.relationText}>{patient.relation}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => router.push({
                                    pathname: '/caregiver/activity',
                                    params: { patientId: patient.user.id, name: patient.user.name }
                                })}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={['#EEF2FF', '#E0E7FF']}
                                    style={styles.viewButtonGradient}
                                >
                                    <Ionicons name="eye-outline" size={16} color="#4F46E5" />
                                    <Text style={styles.viewButtonText}>Activity</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Active Status Indicator */}
                        <View style={styles.activeIndicator}>
                            <View style={[styles.activeDot, { backgroundColor: colors[0] }]} />
                            <Text style={styles.activeText}>Active Caregiver</Text>
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
        backgroundColor: '#FDF2F8',
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
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    countBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
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
    patientCard: {
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#EEF2FF',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    infoContainer: {
        flex: 1,
    },
    patientName: {
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
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    relationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    relationText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    viewButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    viewButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    viewButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F46E5',
    },
    activeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});