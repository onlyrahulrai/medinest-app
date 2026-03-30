import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import RoutineService, { type Routine } from "../../services/api/routine";
import moment from "moment";

interface ManageRoutinesBottomSheetProps {
  visible: boolean;
  onClose: (updated?: boolean) => void;
}

const { height } = Dimensions.get('window');

const ManageRoutinesBottomSheet = ({ visible, onClose }: ManageRoutinesBottomSheetProps) => {
  const [routines, setRoutines] = useState<Routine[]>([]);

  // Custom Routine Modal (Step 4 Style)
  const [showFormModal, setShowFormModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [routineTime, setRoutineTime] = useState(new Date());

  useEffect(() => {
    if (visible) {
      fetchRoutines();
    }
  }, [visible]);

  const fetchRoutines = async () => {
    try {
      const data = await RoutineService.getRoutines();
      setRoutines(data);
    } catch (error) {
      console.error("Error fetching routines:", error);
    }
  };

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
        await RoutineService.updateRoutine(editId, { name: routineName, time: timeStr });
      } else {
        await RoutineService.createRoutine({ name: routineName, time: timeStr });
      }
      setShowFormModal(false);
      setEditId(null);
      fetchRoutines();
    } catch (error) {
      Alert.alert("Error", "Failed to save routine");
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Routine",
      "Are you sure you want to delete this routine?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await RoutineService.deleteRoutine(id);
              fetchRoutines();
            } catch (error) {
              Alert.alert("Error", "Failed to delete routine");
            }
          },
        },
      ]
    );
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) setRoutineTime(selectedDate);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => onClose(true)}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Routines</Text>
            <TouchableOpacity onPress={() => onClose(true)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {routines.map((r) => (
              <View key={r._id} style={styles.routineItem}>
                <View style={styles.routineInfo}>
                  <Text style={styles.routineName}>{r.name}</Text>
                  <View style={styles.routineTimeRow}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.routineTime}>{moment(r.time, 'HH:mm').format('hh:mm A')}</Text>
                  </View>
                </View>
                <View style={styles.routineActions}>
                  <TouchableOpacity onPress={() => openEditModal(r)} style={styles.actionBtn}>
                    <Ionicons name="pencil-outline" size={20} color="#059669" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(r._id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addBtn}
              onPress={openAddModal}
            >
              <Ionicons name="add-circle-outline" size={24} color="#059669" />
              <Text style={styles.addBtnText}>Add New Routine</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => onClose(true)}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 4 Style Add/Edit Modal */}
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
              />

              <Text style={styles.modalLabel}>Occurrence Time</Text>
              <TouchableOpacity style={styles.timeSelectBtn} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={20} color="#4CAF50" />
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
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    marginBottom: 20,
  },
  routineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  routineTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  routineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  routineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderWidth: 2,
    borderColor: '#059669',
    borderStyle: 'dashed',
    borderRadius: 20,
    marginTop: 12,
    backgroundColor: '#F0FDF4',
  },
  addBtnText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  doneBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal Styles (Step 4 Consistency)
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
    borderColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#4CAF50',
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

export default ManageRoutinesBottomSheet;
