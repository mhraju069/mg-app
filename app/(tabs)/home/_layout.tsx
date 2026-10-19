import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Text } from '@/components/ui/text';

export default function ProfileLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name='index'
        options={{
          title: 'Home',
          headerTitle: () =>
            Platform.OS === 'android' ? (
              <Text variant='heading'>Profile</Text>
            ) : undefined,
        }}
      />
    </Stack>
  );
}
