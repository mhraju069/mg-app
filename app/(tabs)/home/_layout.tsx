import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTranslation } from 'react-i18next';

export default function ProfileLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: t('tabs.home', { defaultValue: 'Home' }),
          headerTitle: () =>
            Platform.OS === 'android' ? (
              <Text variant='heading'>{t('tabs.home', { defaultValue: 'Home' })}</Text>
            ) : undefined,
        }}
      />
    </Stack>
  );
}
