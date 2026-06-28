import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface AppDateTimePickerProps {
  visible: boolean;
  mode: "date" | "time";
  value: Date;
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  is24Hour?: boolean;
  confirmLabel?: string;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const defaultTitles: Record<AppDateTimePickerProps["mode"], string> = {
  date: "Select date",
  time: "Select time",
};

export default function AppDateTimePicker({
  visible,
  mode,
  value,
  title,
  minimumDate,
  maximumDate,
  is24Hour = true,
  confirmLabel = "Done",
  onConfirm,
  onCancel,
}: AppDateTimePickerProps) {
  const insets = useSafeAreaInsets();
  const [draftDate, setDraftDate] = useState(value);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setDraftDate(value);
    }
    wasVisibleRef.current = visible;
  }, [visible, value]);

  if (!visible) {
    return null;
  }

  if (Platform.OS === "android") {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        is24Hour={is24Hour}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event.type === "dismissed") {
            onCancel();
            return;
          }

          if (event.type === "set" && date) {
            onConfirm(date);
          }
        }}
      />
    );
  }

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setDraftDate(date);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={onCancel} hitSlop={8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title || defaultTitles[mode]}</Text>
            <TouchableOpacity onPress={() => onConfirm(draftDate)} hitSlop={8}>
              <Text style={styles.doneText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={draftDate}
            mode={mode}
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            is24Hour={is24Hour}
            onChange={handleChange}
            style={styles.picker}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  cancelText: {
    fontSize: 16,
    color: "#64748B",
  },
  doneText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  picker: {
    width: "100%",
    height: 220,
  },
});
