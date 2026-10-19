import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Link, router } from "expo-router";
import { Mail, ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable } from "react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const brownGold = "#9B7C56";

  const emailError =
    email && !email.includes("@") ? "Please enter a valid email address" : "";

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Don't worry! It happens. Please enter the email address associated with your account."
    >
      <View style={styles.form}>
        <Input
          label="Email Address"
          placeholder="your@email.com"
          icon={Mail}
          variant="outline"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType="email-address"
        />

        <Button onPress={() => router.push("/verify-code")}>
          <Text>Send OTP</Text>
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
