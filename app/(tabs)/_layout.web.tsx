import React from 'react';
import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';
import { Tabs } from 'expo-router';
import { Home, Calendar, Key, CircleUser, House } from 'lucide-react-native';
import { HapticTab } from '@/components/ui/haptic-tab';

export default function WebTabsLayout() {
  const primary = useColor('primary');

  const screenOptions = {
    headerShown: false,
    tabBarActiveTintColor: primary,
    tabBarButton: HapticTab
  };

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name='(home)'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            // <Icon name={Home} size={24} color={color} />
            <House color={color} size={24} />
          ),
        }}
      />

      <Tabs.Screen
        name='booking'
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => (
            <Icon name={Calendar} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='access'
        options={{
          title: 'Access',
          tabBarIcon: ({ color }) => (
            <Icon name={Key} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Icon name={CircleUser} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
