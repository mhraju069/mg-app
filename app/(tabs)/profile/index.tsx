import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Bell,
  ChevronRight,
  Globe,
  HelpCircle,
  Info,
  LogOut,
  Shield,
  Star,
  User,
  Crown,
  Thermometer,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/utils/authStore";
import { formatImageUrl, API_BASE_URL } from "@/utils/constants";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const red = "#EF4444";

  const [pushEnabled, setPushEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState(useAuthStore.getState().user);
  const [isLoggedIn, setIsLoggedIn] = useState(useAuthStore.getState().isAuthenticated);

  useEffect(() => {
    let isMounted = true;
    const fetchLatestUser = async () => {
      const auth = useAuthStore.getState();
      if (!auth.accessToken) return;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/user/`, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setCurrentUser(data);
            useAuthStore.setUser(data);
          }
        }
      } catch (e) {
        console.warn("ProfileScreen: failed to fetch profile", e);
      }
    };

    fetchLatestUser();

    return useAuthStore.subscribe(() => {
      const state = useAuthStore.getState();
      setCurrentUser(state.user);
      setIsLoggedIn(state.isAuthenticated);
    });
  }, []);

  const avatarSrc =
    (currentUser?.image || currentUser?.avatar || currentUser?.profile_picture)
      ? formatImageUrl(currentUser.image || currentUser.avatar || currentUser.profile_picture)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          currentUser?.name || (isLoggedIn ? "Member" : "Guest User")
        )}&background=9B7C56&color=fff&size=160`;

  return (
    <Layout title={t("profile.title")}>
      {/* User Info Header */}
      <View style={styles.header}>
        <Image
          source={avatarSrc}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{currentUser?.name || (isLoggedIn ? "Member" : "Guest User")}</Text>
          <Text variant="caption" style={{ color: textMuted }}>
            {currentUser?.email || (isLoggedIn ? "" : "Sign in to access memberships and bookings")}
          </Text>
        </View>
        {!isLoggedIn ? (
          <Pressable
            onPress={() => router.push("/(auth)/login")}
            style={{ backgroundColor: brownGold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Login</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.sections.account")}</Text>
        <Card style={styles.card}>
          <MenuItem
            icon={User}
            label={t("profile.title")}
            onPress={() => router.push("/(tabs)/profile/preview")}
          />
        </Card>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.sections.preferences")}</Text>
        <Card style={styles.card}>
          <View style={styles.menuItem}>
            <View style={styles.iconCircle}>
              <Bell size={20} color={brownGold} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{t("profile.menu.push")}</Text>
              <Text style={{ color: textMuted, fontSize: 14 }}>
                {t("profile.menu.pushSub")}
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: "#D1D5DB", true: brownGold }}
              thumbColor="white"
              style={{ transform: [{ scale: 0.8 }] }}
            />
          </View>

          <View style={styles.separator} />
          <MenuItem
            icon={Crown}
            label={t("profile.menu.premium")}
            onPress={() => router.push("/(tabs)/profile/premium")}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Globe}
            label={t("settings.language")}
            onPress={() => router.push("/(tabs)/profile/language")}
          />
        </Card>
      </View>

      {/* Privacy & Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.sections.privacy")}</Text>
        <Card style={styles.card}>
          <MenuItem
            icon={Shield}
            label={t("profile.menu.privacy")}
            onPress={() => router.push("/(tabs)/profile/privacy")}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={HelpCircle}
            label={t("profile.menu.help")}
            onPress={() => router.push("/(tabs)/profile/help")}
          />
          <View style={styles.separator} />
          <MenuItem
            icon={Info}
            label={t("profile.menu.terms")}
            onPress={() => router.push("/(tabs)/profile/terms")}
          />
        </Card>
      </View>

      {/* Logout Button */}
      {isLoggedIn ? (
        <Pressable
          style={styles.logoutButton}
          onPress={() => {
            useAuthStore.logout();
            router.replace("/(auth)/login");
          }}
        >
          <LogOut size={20} color={red} />
          <Text style={styles.logoutText}>{t("profile.logout")}</Text>
        </Pressable>
      ) : null}
    </Layout>
  );
}

function MenuItem({ icon: IconComp, label, onPress }: any) {
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";

  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.iconCircle}>
        <IconComp size={20} color={brownGold} strokeWidth={1.5} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <ChevronRight size={18} color={textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
    paddingTop: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.title,
    fontWeight: "600",
    color: "#18181B",
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    padding: 2,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "white",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCF2E9",
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
  },
  separator: {
    height: 1,
    backgroundColor: "#F4F4F5",
    marginHorizontal: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    gap: 10,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
});
