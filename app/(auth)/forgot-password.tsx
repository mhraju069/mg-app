import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Link, router } from "expo-router";
import { Mail, ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useToast } from "@/components/ui/toast";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const brownGold = "#9B7C56";
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const emailError =
    email && !email.includes("@") ? "Please enter a valid email address" : "";

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      showErrorToast("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const { API_BASE_URL } = await import("@/utils/constants");
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.status) {
        showSuccessToast("OTP Sent", data.log || "Password reset OTP sent to your email.");
        router.push({
          pathname: "/verify-code",
          params: { email: email.trim(), mode: "forgot-password" },
        });
      } else {
        const msg = data.log || data.message || "Failed to send reset code.";
        setErrorMessage(msg);
        showErrorToast("Error", msg);
      }
    } catch (e: any) {
      const msg = e.message || "Network error. Please try again.";
      setErrorMessage(msg);
      showErrorToast("Connection Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Don't worry! It happens. Please enter the email address associated with your account."
    >
      <View style={styles.form}>
        {errorMessage ? (
          <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{errorMessage}</Text>
          </View>
        ) : null}

        <Input
          label="Email Address"
          placeholder="your@email.com"
          icon={Mail}
          variant="outline"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button onPress={handleSendOtp} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text>Send OTP</Text>
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
