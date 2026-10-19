import { Layout } from "@/components/layout/Layout";
import { Avatar } from "@/components/shared/avatar";
import { BackHeader } from "@/components/shared/booking-header";
import Header from "@/components/shared/inside-header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Fonts } from "@/theme/colors";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TextInput } from "react-native";

export default function PreviewProfileScreen() {
  return (
    <>
      <BackHeader />
      <Layout>
         <Header title="Profile" subtitle="Manage your personal information" />
        <View style={styles.avatarSection}>
          <Avatar editable={false} />
        </View>

        <View style={styles.infoSection}>
          <InfoItem label="Full Name" value="Akash" />
          <InfoItem label="Email Address" value="akash@example.com" />
          <InfoItem label="Phone" value="+1234567890" />
          <InfoItem label="Preferred Language" value="English" />
        </View>

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
