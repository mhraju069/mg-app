import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";

export default function NewPasswordScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || "";
  const otpCode = (params.otp_code as string) || "";

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const passwordError =
    newPassword && password !== newPassword ? "Passwords don't match" : "";

  const handleResetPassword = async () => {
    if (!password || !newPassword) {
      showErrorToast("Required Fields", "Please enter and confirm your new password.");
      return;
    }
    if (password !== newPassword) {
      showErrorToast("Validation Error", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      showErrorToast("Password Too Short", "Password must be at least 6 characters.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { API_BASE_URL } = await import("@/utils/constants");
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp_code: otpCode.trim(),
          new_password: password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status) {
        showSuccessToast("Password Reset Successful", data.log || "You can now log in with your new password.");
        router.replace("/login");
      } else {
        const msg = data.log || data.message || "Failed to reset password.";
        setErrorMessage(msg);
        showErrorToast("Reset Failed", msg);
      }
    } catch (e: any) {
      const msg = e.message || "Network error. Please try again.";
      setErrorMessage(msg);
      showErrorToast("Reset Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Your new password must be different from previously used passwords."
    >
      <View style={styles.form}>
        {errorMessage ? (
          <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{errorMessage}</Text>
          </View>
        ) : null}

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

        <Button onPress={handleResetPassword} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text>Set New Password</Text>
              <ArrowRight size={18} />
            </>
          )}
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
