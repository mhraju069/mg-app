import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Link, router } from "expo-router";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react-native";
// import { useAppleSignIn } from "@/hooks/useAppleSignIn";
import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/toast";
import { useGoogleSignIn } from "@/hooks/useGoogleSignin";
import { API_BASE_URL } from "@/utils/constants";

export default function SignupScreen() {
  const { t } = useTranslation();
  const { error: showErrorToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";

  const { signInWithGoogle, isLoading: isGoogleLoading } = useGoogleSignIn();
  // const { signInWithApple, isLoading: isAppleLoading } = useAppleSignIn();

  // const handleAppleSignIn = async () => {
  //   try {
  //     await signInWithApple();
  //     router.replace("/(tabs)/home");
  //   } catch (error) {
  //     console.error("Apple Sign-In failed", error);
  //     showErrorToast(
  //       t("auth.errors.appleSignInFailed", "Apple Sign-In failed"),
  //       t("auth.errors.tryAgain", "Please try again later.")
  //     );
  //   }
  // };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Signup failed", error);
      showErrorToast(
        t("auth.errors.googleSignInFailed", "Google Sign-In failed"),
        t("auth.errors.tryAgain", "Please try again later.")
      );
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showErrorToast(
        t("errors.required", "Required fields"),
        "Please fill in name, email, and password."
      );
      return;
    }
    if (!email.includes("@")) {
      showErrorToast(t("errors.invalidEmail", "Invalid Email"), "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showErrorToast(t("errors.required", "Password short"), "Password must be at least 6 characters.");
      return;
    }

    setSignupError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status) {
        // Also trigger OTP request so user receives verification email
        try {
          await fetch(`${API_BASE_URL}/auth/get-otp/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), task: "verification" }),
          });
        } catch {
          // Continue to verification
        }

        router.push({
          pathname: "/(auth)/verify-code",
          params: { email: email.trim() },
        });
      } else {
        const msg = data.log || data.message || "Registration failed. Email may already be in use.";
        setSignupError(msg);
        showErrorToast(t("auth.signup.failed", "Signup Failed"), msg);
      }
    } catch (e: any) {
      const msg = e.message || "Failed to connect to authentication service.";
      setSignupError(msg);
      showErrorToast(t("auth.signup.failed", "Signup Failed"), msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.signup.title")}
      subtitle={t("auth.signup.subtitle")}
      showOverlay={false}
    >
      <View style={styles.form}>
        {signupError ? (
          <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#FCA5A5" }}>
            <Text style={{ color: "#DC2626", fontSize: 13, fontWeight: "600" }}>{signupError}</Text>
          </View>
        ) : null}

        <Input
          label={t("auth.signup.nameLabel")}
          placeholder={t("auth.signup.namePlaceholder")}
          icon={User}
          variant="outline"
          value={name}
          onChangeText={setName}
        />

        <Input
          label={t("auth.signup.emailLabel")}
          placeholder={t("auth.signup.emailPlaceholder")}
          icon={Mail}
          variant="outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Input
          label={t("auth.signup.passwordLabel")}
          placeholder={t("auth.signup.passwordPlaceholder")}
          icon={Lock}
          value={password}
          onChangeText={setPassword}
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

        <Button onPress={handleRegister} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text>{t("auth.signup.submit")}</Text>
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
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading}
            style={[
              styles.googleFullButton,
              { borderColor: border, opacity: isGoogleLoading ? 0.7 : 1 },
            ]}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={styles.googleButtonContent}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleButtonText}>
                  {t("auth.signup.continueWithGoogle", "Continue with Google")}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text variant="caption">{t("auth.signup.hasAccount")} </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text
                variant="caption"
                style={{ color: brownGold, fontWeight: "700" }}
              >
                {t("auth.signup.login")}
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
  signupButton: {
    backgroundColor: "#9B7C56",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  signupButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
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
    width: "100%",
  },
  googleFullButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
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
