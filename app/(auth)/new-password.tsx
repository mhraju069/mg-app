import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Link, router } from "expo-router";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable } from "react-native";
import { Icon } from "@/components/ui/icon";

export default function NewPasswordScreen() {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";

  const passwordError =
    newPassword && password !== newPassword ? "Passwords don't match" : "";

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Your new password must be different from previously used passwords."
    >
      <View style={styles.form}>
        <Input
          label="Password"
          placeholder="••••••••"
          icon={Lock}
          secureTextEntry={!showPassword}
          variant="outline"
          value={password}
          onChangeText={setPassword}
          rightComponent={() => (
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? EyeOff : Eye}
                size={20}
                color={textMuted}
              />
            </Pressable>
          )}
        />

        <Input
          label="Confirm Password"
          placeholder="••••••••"
          icon={Lock}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          variant="outline"
          error={passwordError}
          rightComponent={() => (
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
              <Icon
                name={showNewPassword ? EyeOff : Eye}
                size={20}
                color={textMuted}
              />
            </Pressable>
          )}
        />

        <Button onPress={() => router.replace("/login")}>
          <Text>Set New Password</Text>
          <ArrowRight size={18} />
        </Button>

        <View style={styles.footer}>
          <Text variant="caption">Remember your password? </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text
                variant="caption"
                style={{ color: brownGold, fontWeight: "700" }}
              >
                Log in
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  button: {
    backgroundColor: "#9B7C56",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 24,
  },
});
