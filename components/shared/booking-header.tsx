import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";

export function BackHeader({ showBorder = true }: { showBorder?: boolean }) {
  const text = useColor("text");
  const background = useColor("background");
  const primary = useColor("primary");
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: background,
          paddingTop: insets.top + 12,
            borderBottomWidth: showBorder ? 0.2 : 0,
          borderBottomColor: primary,
        },
      ]}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <ChevronLeft size={24} color={text} />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 10,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -4,
    gap: 4,
  },
  backText: {
    fontSize: 18,
    fontWeight: "500",
  },
});
