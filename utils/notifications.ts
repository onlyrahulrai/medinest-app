import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Medication } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const response = await Notifications.getExpoPushTokenAsync();
    token = response.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export async function scheduleMedicationReminder(
  medication: Medication,
  groupMedNames?: string[]
): Promise<string | undefined> {
  if (!medication.reminderEnabled) return;

  try {
    // Schedule notifications for each time
    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);

      // If time has passed for today, schedule for tomorrow
      if (today < new Date()) {
        today.setDate(today.getDate() + 1);
      }

      const body = groupMedNames && groupMedNames.length > 1
        ? `Time to take: ${groupMedNames.join(", ")} (${medication.dosage})`
        : `Time to take ${medication.name} (${medication.dosage})`;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication Reminder",
          body,
          data: { medicationId: medication.id },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as any,
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling medication reminder:", error);
    return undefined;
  }
}

export async function scheduleRefillReminder(
  medication: Medication
): Promise<string | undefined> {
  if (!medication.refillReminder) return;

  try {
    // Schedule a notification when supply is low
    if (medication.currentSupply <= medication.refillAt) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Refill Reminder",
          body: `Your ${medication.name} supply is running low. Current supply: ${medication.currentSupply}`,
          data: { medicationId: medication.id, type: "refill" },
        },
        trigger: null, // Show immediately
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling refill reminder:", error);
    return undefined;
  }
}

export async function cancelMedicationReminders(
  medicationId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        medicationId?: string;
      } | null;
      if (data?.medicationId === medicationId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling medication reminders:", error);
  }
}

export async function updateMedicationReminders(
  medication: Medication
): Promise<void> {
  try {
    // Cancel existing reminders
    await cancelMedicationReminders(medication.id);

    // Schedule new reminders
    await scheduleMedicationReminder(medication);
    await scheduleRefillReminder(medication);
    await scheduleMissedDoseAlert(medication);
  } catch (error) {
    console.error("Error updating medication reminders:", error);
  }
}

export async function scheduleMissedDoseAlert(
  medication: Medication
): Promise<void> {
  if (!medication.reminderEnabled) return;

  try {
    for (const time of medication.times) {
      const [hours, minutes] = time.split(":").map(Number);
      
      // Missed alert is 2 hours after the dose
      let alertHours = hours + 2;
      let alertMinutes = minutes;
      
      if (alertHours >= 24) {
          alertHours -= 24;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Missed Medication Alert",
          body: `${medication.ownerId === 'self' ? 'You' : 'Patient'} may have missed taking ${medication.name}.`,
          data: { medicationId: medication.id, type: "missed", time },
        },
        trigger: {
          hour: alertHours,
          minute: alertMinutes,
          repeats: true,
        } as any,
      });
    }
  } catch (error) {
    console.error("Error scheduling missed dose alert:", error);
  }
}

export async function cancelMissedDoseAlert(
    medicationId: string,
    time?: string
): Promise<void> {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            const data = notif.content.data as { medicationId?: string; type?: string; time?: string };
            if (data?.medicationId === medicationId && data?.type === 'missed') {
                if (!time || data.time === time) {
                    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
                }
            }
        }
    } catch (error) {
        console.error("Error canceling missed dose alert:", error);
    }
}
