import { Stack } from 'expo-router';
import { Link } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Text>{t('notFound.title', { defaultValue: 'This screen does not exist.' })}</Text>
        <Link href='/'>{t('notFound.goHome', { defaultValue: 'Go to home screen!' })}</Link>
      </View>
    </>
  );
}
