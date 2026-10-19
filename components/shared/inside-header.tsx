import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Fonts } from "@/theme/colors";
import { useColor } from "@/hooks/useColor";

interface HeaderProps {
  title: string;
  subtitle: string;
  space?: number;
}

export default function Header({ title, subtitle, space = 46 }: HeaderProps) {
  const textMuted = useColor("textMuted");
  return (
    <View style={{ marginVertical: 12, marginTop: space }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.subtitle, { color: textMuted }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.subtitle,
  },
});
