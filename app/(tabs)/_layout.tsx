import { Tabs } from "expo-router";
import { Home, MapPin, Hexagon, CheckSquare, Settings, Package, PackageOpen } from "lucide-react-native";
import React from "react";

import Colors from "../../constants/colors";
import { useLanguage } from "../../store/language-store";
import { useUserPreferences } from "../../store/user-preferences-store";

export default function TabLayout() {
  const { t } = useLanguage();
  const { experienceLevel } = useUserPreferences();

  const isBeginnerOrHigher = experienceLevel === "beginner" || experienceLevel === "intermediate" || experienceLevel === "advanced";
  const isIntermediateOrHigher = experienceLevel === "intermediate" || experienceLevel === "advanced";
  const isAdvanced = experienceLevel === "advanced";

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: Colors.light.card,
          borderTopColor: Colors.light.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          href: isBeginnerOrHigher ? "/(tabs)/home" : null,
        }}
      />
      <Tabs.Screen
        name="hives"
        options={{
          title: t.tabs.hives,
          tabBarIcon: ({ color }) => <Hexagon size={24} color={color} />,
          href: isBeginnerOrHigher ? "/(tabs)/hives" : null,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t.tabs.tasks,
          tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
          href: isBeginnerOrHigher ? "/(tabs)/tasks" : null,
        }}
      />
      <Tabs.Screen
        name="yards"
        options={{
          title: t.tabs.yards,
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
          href: isIntermediateOrHigher ? "/(tabs)/yards" : null,
        }}
      />
      <Tabs.Screen
        name="harvests"
        options={{
          title: t.tabs.harvests,
          tabBarIcon: ({ color }) => <Package size={24} color={color} />,
          href: isIntermediateOrHigher ? "/(tabs)/harvests" : null,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t.tabs.inventory,
          tabBarIcon: ({ color }) => <PackageOpen size={24} color={color} />,
          href: isAdvanced ? "/(tabs)/inventory" : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
