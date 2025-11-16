import { Stack } from "expo-router";

export default function YardsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="new"
        options={{
          title: "Add Yard",
          presentation: "modal",
          headerStyle: { backgroundColor: "#0F172A" },
          headerTintColor: "#F8FAFC",
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "Yard Details" }} />
    </Stack>
  );
}
