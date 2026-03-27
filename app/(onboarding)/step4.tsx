import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { createOnboardingPayload } from '@/utils/onboardingHelpers';
import { useAuth } from '@/hooks/useAuth';
import { useSelector } from 'react-redux';

const DEFAULT_ROUTINES = [
    { name: 'Morning', time: '09:00' },
    { name: 'Lunch', time: '14:00' },
    { name: 'Night', time: '21:00' },
];

export default function Step4Screen() {
    const router = useRouter();
    const [routines, setRoutines] = useState(DEFAULT_ROUTINES);
    const [isSaving, setIsSaving] = useState(false);
    const { editUserProfile } = useAuth();
    const user = useSelector((state: any) => state.auth.user);

    useEffect(() => {
        if (user && user.routines) {
            setRoutines(user.routines);
        }
    }, [user]);

    // Modal & Picker State
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [newRoutineTime, setNewRoutineTime] = useState(new Date());
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const handleTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(false);
        if (selectedDate) {
            setNewRoutineTime(selectedDate);
        }
    };

    const openEditModal = (index: number) => {
        setEditIndex(index);
        setNewRoutineName(routines[index].name);
        setNewRoutineTime(moment(routines[index].time, 'HH:mm').toDate());
        setShowAddModal(true);
    };

    const deleteRoutine = (index: number) => {
        setRoutines(routines.filter((_, i) => i !== index));
    };

    const handleSaveRoutine = () => {
        if (newRoutineName.trim()) {
            const timeStr = moment(newRoutineTime).format('HH:mm');
            if (editIndex !== null) {
                const updatedRoutines = [...routines];
                updatedRoutines[editIndex] = { name: newRoutineName, time: timeStr };
                setRoutines(updatedRoutines);
            } else {
                setRoutines([...routines, { name: newRoutineName, time: timeStr }]);
            }
            setNewRoutineName('');
            setEditIndex(null);
            setShowAddModal(false);
        }
    };

    const handleNext = async () => {
        if (routines.length === 0) {
            Alert.alert('Required', 'Please add at least one reminder time');
            return;
        }

        setIsSaving(true);

        try {
            // Build payload for step 4
            const payload = createOnboardingPayload(4, {
                routines,
            });

            console.log('Onboarding Step 4 payload:', payload);

            // Save to backend
            const result = await editUserProfile(payload);

            if (result?.message) {
                Alert.alert('Oops', result.message || 'Failed to save. Please try again.');
                return;
            }

            router.push({
                pathname: '/(onboarding)/step5' as any,
            });
        } catch (error) {
            console.error('Step 4 error:', error);
            Alert.alert('Error', 'Failed to save routines. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.replace("/(onboarding)/step3")} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressDotActive]} />
                    <View style={styles.progressDot} />
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Daily Routine</Text>
                <Text style={styles.subtitle}>When do you usually take medicines? This helps us group your reminders.</Text>

                <View style={styles.gridContainer}>
                    {routines.map((routine, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.routineGridCard}
                            onPress={() => openEditModal(index)}
                        >
                            <View style={styles.routineCardHeader}>
                                <Text style={styles.routineName}>{routine.name}</Text>
                                <TouchableOpacity onPress={() => deleteRoutine(index)}>
                                    <Ionicons name="close-circle" size={20} color="#FF5252" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.routineTimeContainer}>
                                <Ionicons name="time" size={22} color="#4CAF50" />
                                <Text style={styles.routineTimeText}>
                                    {moment(routine.time, 'HH:mm').format('hh:mm A')}
                                </Text>
                            </View>
                            <View style={styles.editBadge}>
                                <Text style={styles.editBadgeText}>Tap to edit</Text>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity 
                        style={styles.addGridCard} 
                        onPress={() => {
                            setEditIndex(null);
                            setNewRoutineName('');
                            setNewRoutineTime(moment('08:00', 'HH:mm').toDate());
                            setShowAddModal(true);
                        }}
                    >
                        <Ionicons name="add" size={32} color="#4CAF50" />
                        <Text style={styles.addGridText}>Add New</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {showTimePicker && (
                <DateTimePicker
                    value={newRoutineTime}
                    mode="time"
                    is24Hour={true}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                />
            )}

            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editIndex !== null ? 'Edit Routine' : 'New Routine'}
                        </Text>
                        
                        <Text style={styles.modalLabel}>Routine Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Evening, Bedtime"
                            value={newRoutineName}
                            onChangeText={setNewRoutineName}
                        />

                        <Text style={styles.modalLabel}>Occurrence Time</Text>
                        <TouchableOpacity style={styles.timeSelectBtn} onPress={() => setShowTimePicker(true)}>
                            <Ionicons name="time-outline" size={20} color="#4CAF50" />
                            <Text style={styles.timeSelectText}>
                                {moment(newRoutineTime).format('hh:mm A')}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => {
                                    setShowAddModal(false);
                                    setEditIndex(null);
                                }}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRoutine}>
                                <Text style={styles.saveText}>
                                    {editIndex !== null ? 'Update' : 'Add Routine'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
                    onPress={handleNext}
                    disabled={isSaving}
                >
                    <LinearGradient
                        colors={isSaving ? ['#e0e0e0', '#e0e0e0'] : ['#4CAF50', '#2E7D32']}
                        style={styles.nextButtonGradient}
                    >
                        <Text style={styles.nextButtonText}>
                            Next Step
                        </Text>
                        {isSaving ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="arrow-forward" size={24} color="white" />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center' },
    progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
    progressDotActive: { width: 24, backgroundColor: '#4CAF50' },
    scrollContent: { padding: 24, paddingBottom: 40 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', marginBottom: 30, lineHeight: 24 },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    routineGridCard: {
        width: '47%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    routineCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    routineName: { fontSize: 17, fontWeight: '800', color: '#1E293B', flex: 1 },
    routineTimeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    routineTimeText: { fontSize: 19, fontWeight: '900', color: '#334155' },
    editBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
    editBadgeText: { fontSize: 11, color: '#64748B', fontWeight: '700' },
    addGridCard: {
        width: '47%',
        height: 140,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
    },
    addGridText: { color: '#4CAF50', fontSize: 15, fontWeight: '800', marginTop: 6 },
    footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: '#f0f0f0', backgroundColor: 'white' },
    nextButton: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden' },
    nextButtonDisabled: { opacity: 0.7 },
    nextButtonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    nextButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 28, padding: 28, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 25, elevation: 15 },
    modalTitle: { fontSize: 24, fontWeight: '900', marginBottom: 22, color: '#1E293B' },
    modalLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8, marginLeft: 4 },
    input: { backgroundColor: '#F8FAFC', padding: 18, borderRadius: 14, fontSize: 17, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', color: '#1E293B' },
    timeSelectBtn: { 
        backgroundColor: '#F0FDF4',
        padding: 18,
        borderRadius: 14,
        marginBottom: 26,
        borderWidth: 1.5,
        borderColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    timeSelectText: { color: '#059669', fontSize: 18, fontWeight: '800' },
    modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14 },
    cancelBtn: { padding: 14 },
    cancelText: { color: '#64748B', fontWeight: '800' },
    saveBtn: { backgroundColor: '#4CAF50', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, shadowColor: '#4CAF50', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
    saveText: { color: 'white', fontWeight: '900', fontSize: 17 },
});
