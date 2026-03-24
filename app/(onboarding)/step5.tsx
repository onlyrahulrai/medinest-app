import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { setupOnboardingRoutines } from '../../services/api/routines';
import moment from 'moment';

const DEFAULT_ROUTINES = [
  { name: 'Morning', time: '09:00' },
  { name: 'Lunch', time: '14:00' },
  { name: 'Night', time: '21:00' },
];

export default function Step5Screen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [routines, setRoutines] = useState(DEFAULT_ROUTINES);
  const [isSaving, setIsSaving] = useState(false);
  
  // Time Picker State
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeRoutineIndex, setActiveRoutineIndex] = useState<number | null>(null);
  
  // Custom Routine Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState(new Date());

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate && activeRoutineIndex !== null) {
      const newRoutines = [...routines];
      newRoutines[activeRoutineIndex].time = moment(selectedDate).format('HH:mm');
      setRoutines(newRoutines);
    }
    setActiveRoutineIndex(null);
  };

  const openTimePicker = (index: number) => {
    setActiveRoutineIndex(index);
    setShowTimePicker(true);
  };

  const deleteRoutine = (index: number) => {
    setRoutines(routines.filter((_, i) => i !== index));
  };

  const handleAddRoutine = () => {
    if (newRoutineName.trim()) {
      setRoutines([...routines, { name: newRoutineName, time: moment(newRoutineTime).format('HH:mm') }]);
      setNewRoutineName('');
      setShowAddModal(false);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await setupOnboardingRoutines(routines);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to setup routines', error);
      // Even if it fails, we move forward to not block the user
      router.replace('/(tabs)');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Daily Routine</Text>
        <Text style={styles.subtitle}>When do you usually take medicines? This helps us group your reminders.</Text>

        <View style={styles.routinesList}>
          {routines.map((routine, index) => (
            <View key={index} style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <Ionicons name="time-outline" size={24} color="#4CAF50" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.routineTime}>{moment(routine.time, 'HH:mm').format('hh:mm A')}</Text>
                </View>
              </View>
              <View style={styles.routineActions}>
                <TouchableOpacity onPress={() => openTimePicker(index)} style={styles.actionButton}>
                  <Ionicons name="pencil" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteRoutine(index)} style={styles.actionButton}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.addButtonText}>Add New Routine</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={moment(routines[activeRoutineIndex!]?.time || '09:00', 'HH:mm').toDate()}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Add Routine Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Routine</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Evening, Bedtime"
              value={newRoutineName}
              onChangeText={setNewRoutineName}
              autoFocus
            />
            
            <TouchableOpacity style={styles.timeSelectBtn} onPress={() => {/* In a real app, nested pickers are tricky on Android */}}>
               <Text style={styles.timeSelectText}>Default time will be 08:00 PM</Text>
            </TouchableOpacity>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddRoutine}>
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
          onPress={handleComplete}
          disabled={isSaving}
        >
          <LinearGradient
            colors={isSaving ? ['#e0e0e0', '#e0e0e0'] : ['#4CAF50', '#2E7D32']}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isSaving ? 'Saving...' : 'Finish Setup'}
            </Text>
            {!isSaving && <Ionicons name="arrow-forward" size={24} color="white" />}
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
  routinesList: { gap: 16 },
  routineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  routineInfo: { flexDirection: 'row', alignItems: 'center' },
  routineName: { fontSize: 16, fontWeight: '600', color: '#333' },
  routineTime: { fontSize: 14, color: '#666', marginTop: 2 },
  routineActions: { flexDirection: 'row', gap: 12 },
  actionButton: { padding: 8 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#4CAF50',
    borderRadius: 16,
    marginTop: 10,
    gap: 8,
  },
  addButtonText: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  nextButton: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden' },
  nextButtonDisabled: { opacity: 0.7 },
  nextButtonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  nextButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  timeSelectBtn: { marginBottom: 20 },
  timeSelectText: { color: '#666', fontSize: 14 },
  modalFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#666', fontWeight: '600' },
  saveBtn: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  saveText: { color: 'white', fontWeight: '600' },
});
