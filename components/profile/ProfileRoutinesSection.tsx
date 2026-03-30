import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RoutineService, { Routine } from '@/services/api/routine';
import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
export default function ProfileRoutinesSection() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const [showFormModal, setShowFormModal] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [routineName, setRoutineName] = useState("");
    const [routineTime, setRoutineTime] = useState(new Date());

    const openAddModal = () => {
        setEditId(null);
        setRoutineName("");
        setRoutineTime(moment('08:00', 'HH:mm').toDate());
        setShowFormModal(true);
    };

    const openEditModal = (routine: Routine) => {
        setEditId(routine._id);
        setRoutineName(routine.name);
        setRoutineTime(moment(routine.time, 'HH:mm').toDate());
        setShowFormModal(true);
    };

    const handleSave = async () => {
        if (!routineName.trim()) {
            Alert.alert("Error", "Please enter a routine name");
            return;
        }
        try {
            const timeStr = moment(routineTime).format('HH:mm');
            if (editId) {
                const updated = await RoutineService.updateRoutine(editId, { name: routineName, time: timeStr });
                setRoutines(prev => prev.map(r => r._id === editId ? updated : r));
            } else {
                const created = await RoutineService.createRoutine({ name: routineName, time: timeStr });
                setRoutines(prev => [...prev, created]);
            }
            setShowFormModal(false);
            setEditId(null);
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to save routine");
        }
    };

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) setRoutineTime(selectedDate);
    };

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
                <View style={styles.statsRow}>
                    {routines.length > 0 && (
                        <View style={styles.statBadge}>
                            <Text style={styles.statText}>{activeCount} active</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={openAddModal}
                        style={styles.addButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-circle-outline" size={16} color="#059669" />
                        <Text style={styles.addButtonText}>Add New</Text>
                    </TouchableOpacity>
                </View>
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
                                        style={[styles.iconBtn, { backgroundColor: '#F0F9FF', marginRight: 4 }]}
                                        onPress={() => openEditModal(routine)}
                                        activeOpacity={0.6}
                                    >
                                        <Ionicons name="pencil-outline" size={16} color="#0284C7" />
                                    </TouchableOpacity>
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

            {/* Form Modal */}
            <Modal visible={showFormModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editId ? 'Edit Routine' : 'New Routine'}
                        </Text>

                        <Text style={styles.modalLabel}>Routine Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Afternoon, Bedtime"
                            value={routineName}
                            onChangeText={setRoutineName}
                            returnKeyType="done"
                        />

                        <Text style={styles.modalLabel}>Occurrence Time</Text>
                        <TouchableOpacity style={styles.timeSelectBtn} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={20} color="#059669" />
                            <Text style={styles.timeSelectText}>
                                {moment(routineTime).format('hh:mm A')}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => {
                                    setShowFormModal(false);
                                    setEditId(null);
                                }}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSave}>
                                <Text style={styles.modalSaveText}>
                                    {editId ? 'Update' : 'Add Routine'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {showTimePicker && (
                <DateTimePicker
                    value={routineTime}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
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
    addButton: {
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
    addButtonText: {
        color: '#059669',
        fontWeight: '600',
        fontSize: 13,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 28,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 24,
        color: '#1E293B',
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 10,
        marginLeft: 4,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        padding: 18,
        borderRadius: 16,
        fontSize: 17,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        color: '#1E293B',
        fontWeight: '600',
    },
    timeSelectBtn: {
        backgroundColor: '#F0FDF4',
        padding: 18,
        borderRadius: 16,
        marginBottom: 28,
        borderWidth: 1.5,
        borderColor: '#A7F3D0',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeSelectText: {
        color: '#059669',
        fontSize: 18,
        fontWeight: '800',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 14,
    },
    modalCancelBtn: {
        padding: 16,
    },
    modalCancelText: {
        color: '#64748B',
        fontWeight: '800',
        fontSize: 16,
    },
    modalSaveBtn: {
        backgroundColor: '#059669',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#059669',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    modalSaveText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 17,
    },
});
