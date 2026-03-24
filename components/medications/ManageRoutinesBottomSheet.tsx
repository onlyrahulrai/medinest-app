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
import { getRoutines, createRoutine, deleteRoutine } from "../../services/api/routines";

interface ManageRoutinesBottomSheetProps {
  visible: boolean;
  onClose: (updated?: boolean) => void;
}

const { height } = Dimensions.get('window');

const ManageRoutinesBottomSheet = ({ visible, onClose }: ManageRoutinesBottomSheetProps) => {
  const [routines, setRoutines] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchRoutines();
    }
  }, [visible]);

  const fetchRoutines = async () => {
    try {
      const data = await getRoutines();
      setRoutines(data);
    } catch (error) {
      console.error("Error fetching routines:", error);
    }
  };

  const handleAdd = async () => {
    if (!newName) {
      Alert.alert("Error", "Please enter a routine name (e.g., Morning)");
      return;
    }
    try {
      const timeStr = `${newTime.getHours().toString().padStart(2, "0")}:${newTime.getMinutes().toString().padStart(2, "0")}`;
      await createRoutine({ name: newName, time: timeStr });
      setNewName("");
      setIsAdding(false);
      fetchRoutines();
    } catch (error) {
      Alert.alert("Error", "Failed to add routine");
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
              await deleteRoutine(id);
              fetchRoutines();
            } catch (error) {
              Alert.alert("Error", "Failed to delete routine");
            }
          },
        },
      ]
    );
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
                <View>
                  <Text style={styles.routineName}>{r.name}</Text>
                  <Text style={styles.routineTime}>{r.time}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(r._id)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {isAdding ? (
              <View style={styles.addCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Routine name (e.g. Bedtime)"
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.timeSelect}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.timeSelectText}>
                    {newTime.getHours().toString().padStart(2, "0")}:{newTime.getMinutes().toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>

                <View style={styles.addActions}>
                  <TouchableOpacity 
                    style={[styles.btn, styles.cancelBtn]} 
                    onPress={() => setIsAdding(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.btn, styles.saveBtn]} 
                    onPress={handleAdd}
                  >
                    <Text style={styles.saveBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setIsAdding(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#059669" />
                <Text style={styles.addBtnText}>Add New Routine</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {showTimePicker && (
            <DateTimePicker
              value={newTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowTimePicker(false);
                if (date) setNewTime(date);
              }}
            />
          )}

          <View style={styles.footer}>
             <TouchableOpacity 
                style={styles.doneBtn} 
                onPress={() => onClose(true)}
              >
                <Text style={styles.doneBtnText}>Done</Text>
             </TouchableOpacity>
          </View>
        </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
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
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginBottom: 12,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  routineTime: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 16,
    marginTop: 8,
  },
  addBtnText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#059669',
  },
  addCard: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    padding: 0,
    marginBottom: 16,
  },
  timeSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeSelectText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#059669',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  doneBtn: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ManageRoutinesBottomSheet;
