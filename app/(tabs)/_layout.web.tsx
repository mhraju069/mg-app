import React from 'react';
import { useColor } from '@/hooks/useColor';
import { Tabs } from 'expo-router';
import { Home, Calendar, Key, User } from 'lucide-react-native';
import { HapticTab } from '@/components/ui/haptic-tab';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet } from 'react-native';

export default function WebTabsLayout() {
  const { t } = useTranslation();
  const brownGold = '#9B7C56';

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: brownGold,
    tabBarInactiveTintColor: '#94A3B8',
    tabBarButton: HapticTab,
    tabBarStyle: {
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0,0,0,0.08)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      height: 60,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      paddingBottom: 6,
    },
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name='home'
        options={{
          title: t('tabs.home') || 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name='booking'
        options={{
          tabBarBadge: 2,
          tabBarBadgeStyle: {
            backgroundColor: '#9B7C56',
            color: '#fff',
          },
          title: t('tabs.booking') || 'Booking',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Calendar color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name='access'
        options={{
          title: t('tabs.access') || 'Access',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Key color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: t('tabs.profile') || 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
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
    paddingTop: 6,
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 36,
    height: 3,
    backgroundColor: '#9B7C56',
    borderRadius: 2,
  },
});

