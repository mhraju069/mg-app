import React from 'react';
import { StyleSheet, ViewProps, ScrollViewProps, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { ScrollView } from '../ui/scroll-view';
import { View } from '../ui/view';

interface ScreenViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean | number;
  safe?: boolean;
  style?: any;
  contentContainerStyle?: any;
}

export function ScreenView({
  children,
  scrollable = true,
  padding = true,
  safe = true,
  style,
  contentContainerStyle,
}: ScreenViewProps) {
  const insets = useSafeAreaInsets();
  const background = useColor('background');

  const horizontalPadding = typeof padding === 'number' ? padding : (padding ? 24 : 0);

  const containerStyle = [
    styles.container,
    { backgroundColor: background },
    style
  ];

  const contentPaddingBottom = insets.bottom + (Platform.OS === 'ios' ? 90 : 70);
  const contentPaddingTop = safe ? insets.top : 0;

  if (scrollable) {
    return (
      <ScrollView
        style={containerStyle}
        contentContainerStyle={[
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: padding ? 24 + contentPaddingTop : contentPaddingTop,
            paddingBottom: padding ? 24 + contentPaddingBottom : contentPaddingBottom
          },
          contentContainerStyle
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[
      containerStyle,
      {
        paddingHorizontal: horizontalPadding,
        paddingTop: contentPaddingTop,
        paddingBottom: contentPaddingBottom
      }
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
