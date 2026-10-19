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
import { useBookingStore } from "@/utils/bookingStore";
import { router } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet } from "react-native";

export default function InformationScreen() {
  const { t } = useTranslation();
  const storeState = useBookingStore.getState();

  const [fullName, setFullName] = useState(storeState.fullName || "Akash");
  const [email, setEmail] = useState(storeState.email || "akash@example.com");
  const [phone, setPhone] = useState(storeState.phone || "+31 6 12345678");
  const [specialRequests, setSpecialRequests] = useState(storeState.specialRequests || "");

  const handleContinue = () => {
    useBookingStore.setState({
      fullName,
      email,
      phone,
      specialRequests,
    });
    router.push("/(bookings)/confirmation");
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.information.title") || "Contact Details"}
          subtitle={t("createBooking.information.subtitle") || "Please confirm who the booking reservation is for"}
        />

        <View style={styles.formCard}>
          <Input
            label={t("createBooking.information.labels.fullName") || "Full Name"}
            placeholder={t("createBooking.information.placeholders.fullName") || "e.g. John Doe"}
            variant="outline"
            value={fullName}
            onChangeText={setFullName}
          />
          <Input
            label={t("createBooking.information.labels.email") || "Email Address"}
            placeholder={t("createBooking.information.placeholders.email") || "name@example.com"}
            variant="outline"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label={t("createBooking.information.labels.phone") || "Phone Number"}
            placeholder={t("createBooking.information.placeholders.phone") || "+31 6 12345678"}
            variant="outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Input
            label={t("createBooking.information.labels.specialRequests") || "Special Requests / Notes"}
            placeholder="Dietary requests, quiet room preference, etc."
            variant="outline"
            multiline
            inputStyle={{ height: 90, textAlignVertical: "top" }}
            value={specialRequests}
            onChangeText={setSpecialRequests}
          />

          <AvoidKeyboard />
        </View>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handleContinue}>
          <Text>{t("createBooking.information.continue") || "Continue"}</Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: 16,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
});
