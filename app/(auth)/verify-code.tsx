import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Colors, Fonts } from "@/theme/colors";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable } from "react-native";

export default function VerifyCodeScreen() {
  const [code, setCode] = useState("");
  const brownGold = "#9B7C56";
  const color = useColor("mutedForeground")

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        <Text style={styles.cardSubtitle}>
          We sent a verification code to{" "}
          <Text style={{ color: color, fontWeight: "600" }}>
            user@company.com
          </Text>
          . Enter the code below.
        </Text>
      }
    >
      <View style={styles.form}>
        <View style={styles.otpContainer}>
          <InputOTP
          slotStyle={{
            width: "23%"
          }}
            keyboardType="numeric"
            length={4}
            value={code}
            onChangeText={setCode}
            onComplete={(value) => console.log("OTP complete ", value)}
          />
        </View>

        <Button onPress={() => router.push("/new-password")}>
          <Text>Verify Code</Text>
          <ArrowRight size={18} />
        </Button>

        <View style={styles.footer}>
          <Text variant="caption">Didn't receive the email? </Text>
          <Pressable>
            <Text
              variant="caption"
              style={{ color: brownGold, fontWeight: "700" }}
            >
              Click to resend
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
