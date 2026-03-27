import { Stack } from "expo-router";

export default function OnboardingLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: "white" },
            }}
        >
            <Stack.Screen name="language" />
            <Stack.Screen name="step1" />
            <Stack.Screen name="step2" />
            <Stack.Screen name="step3" />
            <Stack.Screen name="step4" />
            <Stack.Screen name="step5" />
        </Stack>
    );
}
