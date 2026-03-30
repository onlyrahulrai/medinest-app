import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RoutineService, { Routine } from '@/services/api/routine';

export default function ProfileRoutinesSection() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const fetchRoutines = useCallback(async () => {
        setLoading(true);
        try {
            const data = await RoutineService.getRoutines();
            setRoutines(data || []);
        } catch (error: any) {
            console.error("Failed to fetch routines", error?.response?.data || error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoutines();
    }, [fetchRoutines]);

    const handleDeleteRoutine = (routine: Routine) => {
        Alert.alert(
            "Delete Routine",
            `Are you sure you want to delete "${routine.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await RoutineService.deleteRoutine(routine._id);
                            setRoutines(prev => prev.filter(r => r._id !== routine._id));
                        } catch (error: any) {
                            Alert.alert("Error", error?.response?.data?.message || "Failed to delete routine.");
                        }
                    }
                }
            ]
        );
    };

    const handleToggleActive = async (routine: Routine) => {
        try {
            const updated = await RoutineService.updateRoutine(routine._id, {
                name: routine.name,
                time: routine.time,
            });
            setRoutines(prev => prev.map(r => r._id === routine._id ? { ...r, isActive: !r.isActive } : r));
        } catch (error: any) {
            Alert.alert("Error", "Failed to update routine.");
        }
    };

    const formatTime = (time: string) => {
        try {
            const [h, m] = time.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${m} ${ampm}`;
        } catch {
            return time;
        }
    };

    const getTimeIcon = (time: string): string => {
        try {
            const hour = parseInt(time.split(':')[0]);
            if (hour >= 5 && hour < 12) return 'sunny-outline';
            if (hour >= 12 && hour < 17) return 'partly-sunny-outline';
            if (hour >= 17 && hour < 21) return 'moon-outline';
            return 'cloudy-night-outline';
        } catch {
            return 'time-outline';
        }
    };

    const getTimeColor = (time: string): string => {
        try {
            const hour = parseInt(time.split(':')[0]);
            if (hour >= 5 && hour < 12) return '#F59E0B';
            if (hour >= 12 && hour < 17) return '#F97316';
            if (hour >= 17 && hour < 21) return '#8B5CF6';
            return '#6366F1';
        } catch {
            return '#6B7280';
        }
    };

    const displayedRoutines = expanded ? routines : routines.slice(0, 3);
    const activeCount = routines.filter(r => r.isActive).length;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIconContainer}>
                        <Ionicons name="repeat" size={15} color="#059669" />
                    </View>
                    <Text style={styles.sectionTitle}>My Routines</Text>
                </View>
                {routines.length > 0 && (
                    <View style={styles.statsRow}>
                        <View style={styles.statBadge}>
                            <Text style={styles.statText}>{activeCount} active</Text>
                        </View>
                    </View>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#065F46" />
                    <Text style={styles.loadingText}>Loading routines...</Text>
                </View>
            ) : routines.length === 0 ? (
                <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
                    </View>
                    <Text style={styles.emptyTitle}>No Routines Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Set up daily routines to stay on track with your medication schedule
                    </Text>
                </View>
            ) : (
                <View style={styles.routinesContainer}>
                    {displayedRoutines.map((routine, index) => (
                        <View key={routine._id} style={[styles.routineCard, index > 0 && { marginTop: 10 }]}>
                            <View style={styles.routineContent}>
                                <View style={[styles.timeIndicator, { backgroundColor: getTimeColor(routine.time) + '18' }]}>
                                    <Ionicons
                                        name={getTimeIcon(routine.time) as any}
                                        size={18}
                                        color={getTimeColor(routine.time)}
                                    />
                                </View>
                                <View style={styles.routineInfo}>
                                    <Text style={[styles.routineName, !routine.isActive && styles.routineInactive]}>
                                        {routine.name}
                                    </Text>
                                    <Text style={styles.routineTime}>{formatTime(routine.time)}</Text>
                                </View>
                                <View style={styles.routineActions}>
                                    <TouchableOpacity
                                        style={styles.iconBtn}
                                        onPress={() => handleDeleteRoutine(routine)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {routine.isActive && <View style={[styles.routineActiveLine, { backgroundColor: getTimeColor(routine.time) }]} />}
                        </View>
                    ))}

                    {routines.length > 3 && (
                        <TouchableOpacity
                            style={styles.showMoreBtn}
                            onPress={() => setExpanded(!expanded)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.showMoreText}>
                                {expanded ? 'Show Less' : `Show All (${routines.length})`}
                            </Text>
                            <Ionicons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color="#059669"
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}
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
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    statText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669',
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
    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderStyle: 'dashed',
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 19,
        paddingHorizontal: 16,
    },
    routinesContainer: {
        // container
    },
    routineCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    routineContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    timeIndicator: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    routineInfo: {
        flex: 1,
    },
    routineName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    routineInactive: {
        color: '#9CA3AF',
    },
    routineTime: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    routineActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    routineActiveLine: {
        height: 2.5,
    },
    showMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    showMoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#059669',
    },
});
