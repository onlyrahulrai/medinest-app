export type TimeSlotCategory =
  | "Early Morning"
  | "Morning"
  | "Noon"
  | "Afternoon"
  | "Evening"
  | "Night"
  | "Late Night";

export interface ScheduleSlotDisplay {
  category: string;
  timeDisplay: string;
  icon: string;
  sortOrder: number;
}

const CATEGORY_ORDER: Record<TimeSlotCategory, number> = {
  "Early Morning": 1,
  Morning: 2,
  Noon: 3,
  Afternoon: 4,
  Evening: 5,
  Night: 6,
  "Late Night": 7,
};

export const parseScheduledTimeToMinutes = (scheduledTime: string): number => {
  if (!scheduledTime) return 0;

  if (scheduledTime.includes("T")) {
    const date = new Date(scheduledTime);
    if (!Number.isNaN(date.getTime())) {
      return date.getHours() * 60 + date.getMinutes();
    }
  }

  const [hourPart, minutePart = "0"] = scheduledTime.split(":");
  const hours = parseInt(hourPart, 10);
  const minutes = parseInt(minutePart, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

export const formatScheduledTimeDisplay = (scheduledTime: string): string => {
  const minutes = parseScheduledTimeToMinutes(scheduledTime);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();
  date.setHours(hours, mins, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const getTimeSlotCategoryFromMinutes = (
  totalMinutes: number
): ScheduleSlotDisplay => {
  const hour = Math.floor(totalMinutes / 60);

  if (hour >= 5 && hour < 8) {
    return {
      category: "Early Morning",
      timeDisplay: "",
      icon: "sunny-outline",
      sortOrder: CATEGORY_ORDER["Early Morning"],
    };
  }
  if (hour >= 8 && hour < 12) {
    return {
      category: "Morning",
      timeDisplay: "",
      icon: "sunny",
      sortOrder: CATEGORY_ORDER.Morning,
    };
  }
  if (hour === 12) {
    return {
      category: "Noon",
      timeDisplay: "",
      icon: "partly-sunny-outline",
      sortOrder: CATEGORY_ORDER.Noon,
    };
  }
  if (hour >= 13 && hour < 17) {
    return {
      category: "Afternoon",
      timeDisplay: "",
      icon: "cloudy-outline",
      sortOrder: CATEGORY_ORDER.Afternoon,
    };
  }
  if (hour >= 17 && hour < 21) {
    return {
      category: "Evening",
      timeDisplay: "",
      icon: "moon-outline",
      sortOrder: CATEGORY_ORDER.Evening,
    };
  }
  if (hour >= 21) {
    return {
      category: "Night",
      timeDisplay: "",
      icon: "moon",
      sortOrder: CATEGORY_ORDER.Night,
    };
  }

  return {
    category: "Late Night",
    timeDisplay: "",
    icon: "bed-outline",
    sortOrder: CATEGORY_ORDER["Late Night"],
  };
};

const getIconForNamedSlot = (name: string): string => {
  const lower = name.toLowerCase();

  if (lower.includes("early") && lower.includes("morning")) return "sunny-outline";
  if (lower.includes("morning")) return "sunny";
  if (lower.includes("noon") || lower.includes("lunch") || lower.includes("midday")) {
    return "partly-sunny-outline";
  }
  if (lower.includes("afternoon")) return "cloudy-outline";
  if (lower.includes("evening") || lower.includes("dinner")) return "moon-outline";
  if (lower.includes("bed") || lower.includes("sleep")) return "bed-outline";
  if (lower.includes("night")) return "moon";

  return "time-outline";
};

export const getScheduleSlotDisplay = (
  scheduledTime: string,
  routineName?: string | null
): ScheduleSlotDisplay => {
  const timeDisplay = formatScheduledTimeDisplay(scheduledTime);

  if (routineName?.trim()) {
    return {
      category: routineName.trim(),
      timeDisplay,
      icon: getIconForNamedSlot(routineName),
      sortOrder: getTimeSlotCategoryFromMinutes(parseScheduledTimeToMinutes(scheduledTime)).sortOrder,
    };
  }

  const categoryInfo = getTimeSlotCategoryFromMinutes(parseScheduledTimeToMinutes(scheduledTime));

  return {
    category: categoryInfo.category,
    timeDisplay,
    icon: categoryInfo.icon,
    sortOrder: categoryInfo.sortOrder,
  };
};

export const getRoutineNameFromLog = (
  log: { routineId?: any },
  routines: Array<{ _id: string; name: string }> = []
): string | undefined => {
  if (!log.routineId) return undefined;

  if (typeof log.routineId === "object" && log.routineId?.name) {
    return log.routineId.name;
  }

  const routineId = typeof log.routineId === "string" ? log.routineId : log.routineId?._id;
  return routines.find((routine) => routine._id === routineId)?.name;
};

export const getRoutineIdFromLog = (log: { routineId?: any }): string | undefined => {
  if (!log.routineId) return undefined;
  if (typeof log.routineId === "string") return log.routineId;
  return log.routineId?._id ? String(log.routineId._id) : undefined;
};

export const getMedicineIdFromLog = (log: { medicineId?: any }): string | undefined => {
  if (!log.medicineId) return undefined;
  if (typeof log.medicineId === "string") return log.medicineId;
  return log.medicineId?._id ? String(log.medicineId._id) : undefined;
};

export const getLogUniqueKey = (log: {
  _id?: string;
  medicineId?: any;
  routineId?: any;
  scheduledTime?: string;
}): string => {
  if (log._id) return String(log._id);

  const medicineId = getMedicineIdFromLog(log) ?? "unknown";
  const routineId = getRoutineIdFromLog(log) ?? "none";
  const timeMinutes = parseScheduledTimeToMinutes(String(log.scheduledTime ?? ""));

  return `${medicineId}:${routineId}:${timeMinutes}`;
};

export interface GroupedMedicineLog {
  key: string;
  timeMinutes: number;
  logs: Array<{ _id: string; scheduledTime: string; routineId?: any; medicineId?: any; status?: string }>;
}

export const groupMedicineLogsForDisplay = (
  logs: GroupedMedicineLog["logs"],
  _routines: Array<{ _id: string; name: string }> = []
): GroupedMedicineLog[] => {
  const groups = new Map<string, GroupedMedicineLog["logs"]>();

  logs.forEach((log) => {
    const timeMinutes = parseScheduledTimeToMinutes(String(log.scheduledTime));
    const groupKey = `time:${timeMinutes}`;

    const bucket = groups.get(groupKey) ?? [];
    const logKey = getLogUniqueKey(log);

    if (!bucket.some((existing) => getLogUniqueKey(existing) === logKey)) {
      bucket.push(log);
    }

    groups.set(groupKey, bucket);
  });

  return Array.from(groups.entries())
    .map(([key, groupedLogs]) => ({
      key,
      timeMinutes: parseScheduledTimeToMinutes(String(groupedLogs[0]?.scheduledTime ?? "")),
      logs: groupedLogs.sort((a, b) => {
        const nameCompare = String(a.medicineId?.name || "").localeCompare(
          String(b.medicineId?.name || "")
        );
        if (nameCompare !== 0) return nameCompare;
        return getLogUniqueKey(a).localeCompare(getLogUniqueKey(b));
      }),
    }))
    .sort((a, b) => a.timeMinutes - b.timeMinutes);
};
