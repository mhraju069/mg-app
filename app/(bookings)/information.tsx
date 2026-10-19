import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { AvoidKeyboard } from "@/components/ui/avoid-keyboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";

export default function InformationScreen() {
  const { t } = useTranslation();
  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.information.title")}
          subtitle={t("createBooking.information.subtitle")}
        />

        <View style={styles.formCard}>
          <Input label={t("createBooking.information.labels.fullName")} placeholder={t("createBooking.information.placeholders.fullName")} variant="outline" />
          <Input
            label={t("createBooking.information.labels.email")}
            placeholder={t("createBooking.information.placeholders.email")}
            variant="outline"
            keyboardType="email-address"
          />
          <Input
            label={t("createBooking.information.labels.phone")}
            placeholder={t("createBooking.information.placeholders.phone")}
            variant="outline"
            keyboardType="phone-pad"
            type="numeric"
          />
          <Input
            label={t("createBooking.information.labels.specialRequests")}
            variant="outline"
            multiline
            inputStyle={{ height: 100, textAlignVertical: "top" }}
            type="textarea"
          />

          <AvoidKeyboard />
        </View>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={() => router.push("/(bookings)/confirmation")}>
          <Text>{t("createBooking.information.continue")}</Text>
          <ArrowRight />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formCard: {
    //  padding: 24,
    borderRadius: 24,
    gap: 20,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  continueButton: {
    backgroundColor: "#9B7C56",
    borderRadius: 30,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
