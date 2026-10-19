import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

const languages = [
  { id: 'en', title: 'English', subtitle: 'English' },
  { id: 'nl', title: 'Nederlands', subtitle: 'Dutch' },
  { id: 'de', title: 'Deutsch', subtitle: 'German' },
  { id: 'fr', title: 'Français', subtitle: 'French' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState(i18n.language || 'en');
  const brownGold = '#9B7C56';
  const border = useColor('border');

  const handleContinue = async () => {
    await i18n.changeLanguage(selected);
    router.replace('/(tabs)/(home)');
  };

  return (
    <AuthLayout
      title={t('language.title')}
      subtitle={t('language.subtitle')}
    >
      <View style={styles.form}>
        <View style={styles.list}>
          {languages.map((lang) => (
            <Pressable
              key={lang.id}
              onPress={() => setSelected(lang.id)}
              style={[
                styles.item,
                { borderColor: border },
                selected === lang.id && { backgroundColor: brownGold, borderColor: brownGold },
              ]}
            >
              <View>
                <Text
                  style={[
                    styles.itemTitle,
                    selected === lang.id && { color: 'white' }
                  ]}
                >
                  {lang.title}
                </Text>
                <Text
                  variant="caption"
                  style={[
                    styles.itemSubtitle,
                    selected === lang.id && { color: 'rgba(255,255,255,0.7)' }
                  ]}
                >
                  {lang.subtitle}
                </Text>
              </View>
              {selected === lang.id && <Check size={20} color="white" />}
            </Pressable>
          ))}
        </View>

        <Button
          onPress={handleContinue}
        >
          <Text>{t('buttons.continue')}</Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 24,
    marginBottom: 24
  },
  list: {
    gap: 12,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
  },
});
