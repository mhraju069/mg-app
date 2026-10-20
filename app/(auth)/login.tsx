import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Colors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Apple,
} from "lucide-react-native";
import { useGoogleSignIn } from "@/hooks/useGoogleSignin";
import { useAppleSignIn } from "@/hooks/useAppleSignIn";
import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/toast";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { error: showErrorToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [checked, setChecked] = useState(false);
  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";

  const { signInWithGoogle, isLoading: isGoogleLoading } = useGoogleSignIn();
  const { signInWithApple, isLoading: isAppleLoading } = useAppleSignIn();

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Apple Sign-In failed", error);
      showErrorToast(
        t("auth.errors.appleSignInFailed", "Apple Sign-In failed"),
        t("auth.errors.tryAgain", "Please try again later.")
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Login failed", error);
      showErrorToast(
        t("auth.errors.googleSignInFailed", "Google Sign-In failed"),
        t("auth.errors.tryAgain", "Please try again later.")
      );
    }
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);

  const emailError =
    email && !email.includes("@") ? t("errors.invalidEmail") : "";
  const passwordError =
    password && password.length < 6
      ? t("errors.required")
      : "";

  const handleEmailLogin = async () => {
    if (!email || !password) {
      showErrorToast(
        t("errors.required", "Required fields"),
        "Please enter your email and password"
      );
      return;
    }
    setLoginErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok && data.status && data.access) {
        const { useAuthStore } = await import("@/utils/authStore");
        useAuthStore.login({
          user: data.user,
          access: data.access,
          refresh: data.refresh,
        });
        router.replace("/(tabs)/home");
      } else {
        const msg = data.log || data.message || "Invalid email or password.";
        setLoginErrorMsg(msg);
        showErrorToast(t("auth.login.failed", "Login Failed"), msg);
      }
    } catch (e: any) {
      const msg = e.message || "Unable to connect to server. Please try again.";
      setLoginErrorMsg(msg);
      showErrorToast(t("auth.login.failed", "Login Failed"), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      showOverlay={false}
    >
      <View style={styles.form}>
        {loginErrorMsg ? (
          <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{loginErrorMsg}</Text>
          </View>
        ) : null}

        <Input
          label={t("auth.login.emailLabel")}
          placeholder={t("auth.login.emailPlaceholder")}
          icon={Mail}
          variant="outline"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          keyboardType="email-address"
        />

        <Input
          label={t("auth.login.passwordLabel")}
          placeholder={t("auth.login.passwordPlaceholder")}
          icon={Lock}
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          secureTextEntry={!showPassword}
          variant="outline"
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

        <View style={styles.row}>
          <Checkbox
            checked={checked}
            onCheckedChange={setChecked}
            label={t("auth.login.rememberMe", "Remember me")}
          />
          <Link href="/forgot-password" asChild>
            <Pressable>
              <Text style={{ color: Colors.light.primary }}>
                {t("auth.login.forgotPassword")}
              </Text>
            </Pressable>
          </Link>
        </View>

        <Button onPress={handleEmailLogin} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text>{t("auth.login.submit")}</Text>
              <ArrowRight size={18} />
            </>
          )}
        </Button>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: "#e4e4e7" }]} />
          <Text variant="caption" style={styles.dividerText}>
            {t("auth.login.orContinue", "or continue with")}
          </Text>
          <View style={[styles.divider, { backgroundColor: "#e4e4e7" }]} />
        </View>

        <View style={styles.socialContainer}>
          <SocialButton
            icon="apple"
            onPress={handleAppleSignIn}
            loading={isAppleLoading}
          />
          <SocialButton
            icon="google"
            onPress={handleGoogleSignIn}
            loading={isGoogleLoading}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="caption">{t("auth.login.noAccount")} </Text>
          <Link href="/signup" asChild>
            <Pressable>
              <Text
                variant="caption"
                style={{ color: brownGold, fontWeight: "700" }}
              >
                {t("auth.login.signUp")}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </AuthLayout>
  );
}

function SocialButton({ icon, onPress, loading }: { icon: string; onPress?: () => void; loading?: boolean }) {
  const border = useColor("border");
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.socialButton, { borderColor: border, opacity: loading ? 0.6 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#000" />
      ) : icon === "apple" ? (
        <Ionicons name="logo-apple" size={30} color="#000" />
      ) : (
        <Ionicons name="logo-google" size={30} color="#000" />
      )}
    </Pressable>
  );
}


const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -4,
    marginBottom: 18,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: "#a1a1aa",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  socialIconText: {
    fontSize: 24,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
});
