import { Stack } from 'expo-router';
import { useColor } from '@/hooks/useColor';
import { Platform, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useTranslation } from 'react-i18next';

export default function SettingsLayout() {
  const { t } = useTranslation();
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
          title: t('tabs.booking', { defaultValue: 'My Reservations' }),
          headerTitle: () =>
            Platform.OS === 'android' ? (
              <Text variant='heading'>{t('tabs.booking', { defaultValue: 'Booking' })}</Text>
            ) : undefined,
        }}
      />
      <Stack.Screen
        name='[id]'
        options={{
          title: '[id]',
          headerTitle: () =>
            Platform.OS === 'android' ? (
              <Text variant='heading'>{t('tabs.booking', { defaultValue: 'Booking' })}</Text>
            ) : undefined,
        }}
      />
    </Stack>
  );
}
