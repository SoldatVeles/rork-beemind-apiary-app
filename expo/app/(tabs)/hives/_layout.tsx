import { Stack } from "expo-router";

export default function HivesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: "Hive Details" }} />
    </Stack>
  );
}
