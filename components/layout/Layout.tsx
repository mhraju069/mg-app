import React, { ReactNode } from "react";
import { Platform, View, StyleSheet, ScrollView } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";

type Props = {
  children?: ReactNode;
  stickyHeaderIndices?: number[];
  refreshControl?: React.ReactElement<any>;
  paddingHorizontal?: number;
  backgroundColor?: string;
  paddingTop?: number;
  fixedHeader?: ReactNode;
  title?: string;
} & SafeAreaViewProps;

export function Layout({
  children,
  style,
  refreshControl,
  paddingTop,
  fixedHeader,
  title,
  ...props
}: Props) {
  const insets = useSafeAreaInsets();
  const activePaddingHorizontal = props.paddingHorizontal ?? 24;
  const background = useColor("background");
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [20, 60],
      [0, 1],
      Extrapolate.CLAMP,
    );
    return {
      opacity,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [20, 60],
            [10, 0],
            Extrapolate.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <SafeAreaView
      edges={props.edges || ["left", "right", "top"]}
      style={{
        flex: 1,
        backgroundColor: background,
      }}
      {...props}
    >
      {/* Sticky Animated Header */}
      <View style={styles.headerContainer}>
        <Animated.View style={[styles.headerTitleWrapper, headerStyle]}>
          <Text style={styles.headerTitle}>{title}</Text>
        </Animated.View>
      </View>

      {fixedHeader}

      <Animated.ScrollView
        stickyHeaderIndices={props.stickyHeaderIndices}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          {
            flexGrow: 1,
            gap: 18,
            paddingHorizontal: activePaddingHorizontal,
            paddingBottom: Math.max(Platform.OS === "ios" ? 120 : 80, 70 + insets.bottom),
            paddingTop: Platform.OS === "ios" ? 20 : 20,
          },
          style,
        ]}
      >
        {children}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 0, // Roughly below status bar
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: "none",
  },
  headerTitleWrapper: {
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    height: 40,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
    textAlign: "center",
  },
});
