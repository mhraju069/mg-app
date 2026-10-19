import { useColorScheme } from "@/hooks/useColorScheme";
import { BlurView as ExpoBlurView } from "expo-blur";
import { Tabs } from "expo-router";
import {
  Calendar,
  Home,
  Key,
  User,
} from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  const brownGold = "#9B7C56";
  const colorScheme = useColorScheme();
  const tint = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0.5,
          borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 56,
          backgroundColor: "rgba(255,255,255,0.9)",
        },
        tabBarBackground: () => (
          <ExpoBlurView
            intensity={Platform.OS === 'ios' ? 80 : 100}
            tint={tint}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: brownGold,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: Platform.OS === 'ios' ? 0 : 20,
          padding: 6
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
         tabBarBadge: 2,
         tabBarBadgeStyle: {
            backgroundColor: "#9B7C56",
            color: "#fff"
         },
          title: t("tabs.booking"),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Calendar size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="access"
        options={{
          title: t("tabs.access"),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Key size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <User size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 48,
    height: 3,
    backgroundColor: "#9B7C56",
    borderRadius: 2,
  },
});
