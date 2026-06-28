export const MEDICATION_THEMES = {
  self: {
    primary: "#065F46",
    secondary: "#064E3B",
    accent: "#059669",
    lightAccent: "#D1FAE5",
    headerColors: ["#065F46", "#064E3B"] as const,
    icon: "heart" as const,
    label: "Personal Health Profile",
  },
  other: {
    primary: "#1E40AF",
    secondary: "#1E3A8A",
    accent: "#2563EB",
    lightAccent: "#DBEAFE",
    headerColors: ["#1E40AF", "#1E3A8A"] as const,
    icon: "people-outline" as const,
    label: "Managed Patient",
  },
} as const;

export type MedicationTheme = (typeof MEDICATION_THEMES)[keyof typeof MEDICATION_THEMES];

export const normalizeEntityId = (value: unknown): string | undefined => {
  if (value == null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const record = value as { _id?: unknown; id?: unknown; toString?: () => string };
    const nestedId = record._id ?? record.id;

    if (nestedId != null) {
      return String(nestedId);
    }

    if (typeof record.toString === "function") {
      const serialized = record.toString();
      if (serialized && serialized !== "[object Object]") {
        return serialized;
      }
    }
  }

  const serialized = String(value);
  return serialized === "[object Object]" ? undefined : serialized;
};

export const getCurrentUserId = (user?: Record<string, any> | null): string | undefined => {
  if (!user) {
    return undefined;
  }

  return (
    normalizeEntityId(user.id) ??
    normalizeEntityId(user._id) ??
    normalizeEntityId(user.userId) ??
    normalizeEntityId(user.user)
  );
};

/** True when the patient created the plan for themselves ("Added by Self"). */
export const isSelfCreatedGroup = (group: {
  user?: unknown;
  createdBy?: unknown;
  isSelfCreated?: boolean;
}): boolean => {
  if (group.isSelfCreated === true) {
    return true;
  }

  if (group.isSelfCreated === false) {
    return false;
  }

  const patientId = normalizeEntityId(group.user);
  const creatorId = normalizeEntityId(group.createdBy);

  if (!creatorId) {
    return true;
  }

  if (!patientId) {
    return true;
  }

  return creatorId === patientId;
};

export const isSelfOwner = (
  ownerId: string | undefined,
  currentUserId?: string | null
): boolean => {
  const normalizedOwnerId = normalizeEntityId(ownerId);
  const normalizedCurrentUserId = normalizeEntityId(currentUserId);

  if (!normalizedOwnerId || normalizedOwnerId === "self") {
    return true;
  }

  if (!normalizedCurrentUserId) {
    return false;
  }

  return normalizedOwnerId === normalizedCurrentUserId;
};

export const resolveOwnerId = (
  patientUserId?: unknown,
  currentUserId?: string | null,
  createdBy?: unknown
): string => {
  const normalizedPatientId = normalizeEntityId(patientUserId);

  if (!normalizedPatientId || normalizedPatientId === "self") {
    return "self";
  }

  if (isSelfCreatedGroup({ user: normalizedPatientId, createdBy })) {
    return "self";
  }

  if (isSelfOwner(normalizedPatientId, currentUserId)) {
    return "self";
  }

  return normalizedPatientId;
};

export const getMedicationTheme = (
  ownerId: string | undefined,
  currentUserId?: string | null,
  options?: { isSelfCreated?: boolean }
): MedicationTheme => {
  if (options?.isSelfCreated || isSelfOwner(ownerId, currentUserId)) {
    return MEDICATION_THEMES.self;
  }

  return MEDICATION_THEMES.other;
};

export const getMedicationThemeForGroup = (
  group: { user?: unknown; createdBy?: unknown; isSelfCreated?: boolean },
  currentUserId?: string | null
): MedicationTheme => {
  if (isSelfCreatedGroup(group)) {
    return MEDICATION_THEMES.self;
  }

  if (isSelfOwner(normalizeEntityId(group.user), currentUserId)) {
    return MEDICATION_THEMES.self;
  }

  const creatorId = normalizeEntityId(group.createdBy);
  const currentId = normalizeEntityId(currentUserId);

  if (creatorId && currentId && creatorId === currentId) {
    return MEDICATION_THEMES.self;
  }

  return MEDICATION_THEMES.other;
};
