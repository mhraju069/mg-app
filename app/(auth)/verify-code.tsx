import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/utils/authStore";
import { API_BASE_URL } from "@/utils/constants";

export default function VerifyCodeScreen() {
  const params = useLocalSearchParams();
  const targetEmail = (params.email as string) || "user@example.com";
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const brownGold = "#9B7C56";
  const color = useColor("mutedForeground");
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const finalCode = (codeToVerify || code).trim();
    if (finalCode.length < 4) {
      showErrorToast("Incomplete Code", "Please enter the full verification code.");
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp_code: finalCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.access) {
        useAuthStore.login({
          user: data.user,
          access: data.access,
          refresh: data.refresh,
        });
        showSuccessToast("Account Verified", "Welcome to Haven Wellness!");
        router.replace("/(tabs)/home");
      } else {
        const msg = data.log || data.message || "Invalid or expired verification code.";
        setErrorMessage(msg);
        showErrorToast("Verification Failed", msg);
      }
    } catch (e: any) {
      const msg = e.message || "Network error. Please try again.";
      setErrorMessage(msg);
      showErrorToast("Verification Failed", msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setResendNotice(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/get-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, task: "verification" }),
      });
      const data = await res.json();
      if (res.ok && data.status) {
        setResendNotice("A fresh verification code has been sent to your email.");
        showSuccessToast("Code Sent", "Please check your inbox.");
      } else {
        const msg = data.log || "Could not resend code. Please try again shortly.";
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage("Network error while resending code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        <Text style={styles.cardSubtitle}>
          We sent a verification code to{" "}
          <Text style={{ color: color, fontWeight: "600" }}>
            {targetEmail}
          </Text>
          . Enter the code below.
        </Text>
      }
    >
      <View style={styles.form}>
        {errorMessage ? (
          <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{errorMessage}</Text>
          </View>
        ) : null}

        {resendNotice ? (
          <View style={{ backgroundColor: "#ECFDF5", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#A7F3D0" }}>
            <Text style={{ color: "#065F46", fontSize: 13, fontWeight: "600" }}>{resendNotice}</Text>
          </View>
        ) : null}

        <View style={styles.otpContainer}>
          <InputOTP
            slotStyle={{
              width: "15%",
            }}
            keyboardType="numeric"
            length={6}
            value={code}
            onChangeText={setCode}
            onComplete={(value) => handleVerifyOtp(value)}
          />
        </View>

        <Button onPress={() => handleVerifyOtp()} disabled={isVerifying}>
          {isVerifying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text>Verify Code</Text>
              <ArrowRight size={18} />
            </>
          )}
        </Button>

        <View style={styles.footer}>
          <Text variant="caption">Didn't receive the email? </Text>
          <Pressable onPress={handleResendOtp} disabled={isResending}>
            <Text
              variant="caption"
              style={{ color: brownGold, fontWeight: "700" }}
            >
              {isResending ? "Sending..." : "Click to resend"}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 24,
  },
    cardSubtitle: {
    fontSize: 14,
    color: "#71717a",
    fontFamily: Fonts.subtitle
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
});
