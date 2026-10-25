import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/shared/avatar";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Fonts } from "@/theme/colors";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
import { StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/utils/authStore";
import { API_BASE_URL } from "@/utils/constants";

export default function PreviewProfileScreen() {
  const [profile, setProfile] = useState<any>(useAuthStore.getState().user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
      const auth = useAuthStore.getState();
      if (!auth.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/auth/user/`, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setProfile(data);
            useAuthStore.setUser(data);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user profile:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <BackHeader />
      <Layout>
        <Header title="Profile" subtitle="Manage your personal information" />
        <View style={styles.avatarSection}>
          <Avatar
            editable={false}
            defaultValue={
              profile?.image ||
              profile?.avatar ||
              profile?.profile_picture ||
              (profile?.name
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile.name
                  )}&background=9B7C56&color=fff&size=160`
                : undefined)
            }
          />
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#9B7C56" />
          </View>
        ) : (
          <View style={styles.infoSection}>
            <InfoItem label="Full Name" value={profile?.name || "Not provided"} />
            <InfoItem label="Email Address" value={profile?.email || "Not provided"} />
            <InfoItem label="Phone Number" value={profile?.phone || "Not provided"} />
            <InfoItem label="Bio / Notes" value={profile?.bio || "Not provided"} />
            <InfoItem label="Preferred Language" value={profile?.language?.toUpperCase() || "EN"} />
          </View>
        )}

        <Button onPress={() => router.push("/(tabs)/profile/edit")}>
          Edit Profile
        </Button>
      </Layout>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ marginBottom: 8, fontSize: 14 }}>{label}</Text>
      <TextInput
        value={value}
        readOnly
        style={{
          backgroundColor: "#F5F1ED",
          padding: 16,
          fontSize: 16,
          fontFamily: Fonts.serif,
          borderWidth: 1,
          borderColor: "#EBE3DB",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
   //  marginBottom: 40,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  infoSection: {
    gap: 18,
    marginBottom: 30,
  },
  infoItem: {
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#D4C4B0",
    height: 56,
    borderRadius: 14,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "black",
  },
});
