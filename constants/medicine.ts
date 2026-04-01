export const MEDICATION_TYPES = [
    { id: "tablet", label: "Tablet", icon: "tablet-portrait-outline" as const },
    { id: "capsule", label: "Capsule", icon: "ellipse-outline" as const },
    { id: "liquid", label: "Liquid", icon: "water-outline" as const },
    { id: "injection", label: "Injection", icon: "fitness-outline" as const },
    { id: "drops", label: "Drops", icon: "eyedrop-outline" as const },
    { id: "inhaler", label: "Inhaler", icon: "cloud-outline" as const },
    { id: "cream", label: "Cream", icon: "bandage-outline" as const },
    { id: "patch", label: "Patch", icon: "square-outline" as const },
];

export const MEAL_TIMINGS = [
    { id: "before", label: "Before Meal", icon: "time-outline" as const },
    { id: "after", label: "After Meal", icon: "restaurant-outline" as const },
    { id: "with", label: "With Meal", icon: "fast-food-outline" as const },
    { id: "empty", label: "Empty Stomach", icon: "moon-outline" as const },
    { id: "bedtime", label: "Bed Time", icon: "bed-outline" as const },
    { id: "any", label: "Any Time", icon: "sunny-outline" as const },
];

export const DOSAGE_UNITS = ["mg", "ml", "mcg", "IU", "drops", "puffs", "units"];

export const MEDICINE_COLORS = [
    "#4CAF50", "#2196F3", "#FF9800", "#E91E63", "#9C27B0",
    "#00BCD4", "#FF5722", "#607D8B", "#795548", "#F44336",
];

export const FREQUENCIES = [
    { id: "1", label: "Once daily", icon: "sunny-outline" as const, times: ["09:00"] },
    { id: "2", label: "Twice daily", icon: "sync-outline" as const, times: ["09:00", "21:00"] },
    { id: "3", label: "Three times daily", icon: "time-outline" as const, times: ["09:00", "15:00", "21:00"] },
    { id: "4", label: "Four times daily", icon: "repeat-outline" as const, times: ["09:00", "13:00", "17:00", "21:00"] },
    { id: "5", label: "As needed", icon: "calendar-outline" as const, times: [] },
];

export const DURATIONS = [
    { id: "1", label: "7 days", value: 7 },
    { id: "2", label: "14 days", value: 14 },
    { id: "3", label: "30 days", value: 30 },
    { id: "4", label: "90 days", value: 90 },
    { id: "5", label: "Ongoing", value: -1 },
];