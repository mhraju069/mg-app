import { Stack } from 'expo-router';
import { useColor } from '@/hooks/useColor';
import { Platform, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { isLiquidGlassAvailable } from 'expo-glass-effect';

export default function SettingsLayout() {
  const theme = useColorScheme();
  const text = useColor('text');
  const background = useColor('background');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: 'Profile',
          headerTitle: () =>
            Platform.OS === 'android' ? (
              <Text variant='heading'>Profile</Text>
            ) : undefined,
        }}
      />
      <Stack.Screen
        name='preview'
        options={{
          title: 'Profile',
          headerTitle: () =>
            Platform.OS === 'android' ? (
              <Text variant='heading'>Profile</Text>
            ) : undefined,
        }}
      />
    </Stack>
  );
}
