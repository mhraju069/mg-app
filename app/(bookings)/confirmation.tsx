import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { router } from "expo-router";
import { Calendar, Clock, Users, Zap } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";

export default function ConfirmationScreen() {
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const { t } = useTranslation();

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.confirmation.title")}
          subtitle={t("createBooking.confirmation.subtitle")}
        />

        <Card style={styles.summaryCard}>
          <Text style={styles.serviceName}>{t("home.categories.sauna.services.private-sauna.title")}</Text>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
              <Calendar size={18} color={brownGold} />
            </View>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("booking.details.labels.date")}
              </Text>
              <Text style={styles.detailValue}>Friday 20 February 2026</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
              <Clock size={18} color={brownGold} />
            </View>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("booking.details.labels.time")}
              </Text>
              <Text style={styles.detailValue}>12:00 PM</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
              <Users size={18} color={brownGold} />
            </View>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("booking.details.labels.guests")}
              </Text>
              <Text style={styles.detailValue}>2</Text>
            </View>
          </View>
        </Card>

        <Card>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentLabel}>
              <Clock size={16} color="black" />
              <Text style={styles.paymentTitle}>{t("createBooking.confirmation.labels.payment")}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t("home.categories.sauna.services.private-sauna.title")}</Text>
            <Text style={styles.priceValue}>€89</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("createBooking.confirmation.labels.total")}</Text>
            <Text style={styles.totalValue}>€89</Text>
          </View>

          <Text variant="caption" style={styles.paymentNote}>
            {t("createBooking.confirmation.notes.payment")}
          </Text>
        </Card>

        <Card style={[styles.accessCodeCard, { backgroundColor: brownGold }]}>
          <View style={styles.accessCodeHeader}>
            <Zap size={20} color="white" />
            <Text style={styles.accessCodeTitle}>{t("access.label")}</Text>
          </View>
          <Text style={styles.accessCodeDesc}>
            {t("createBooking.confirmation.notes.accessCode")}
          </Text>
        </Card>

        <Card>
          <View style={styles.paymentHeader}>
              <Text style={styles.paymentTitle}>{t("createBooking.confirmation.labels.cancellationPolicy")}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t("createBooking.confirmation.notes.policy")}</Text>
          </View>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={() => router.replace("/(tabs)/home")}>
          {t("createBooking.confirmation.button", { amount: "€89.00" })}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 24,
    borderRadius: 24,
    gap: 20,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  paymentHeader: {
    marginBottom: 16,
  },
  paymentLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: "#3F3F46",
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F5",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  paymentNote: {
    color: "#71717A",
    lineHeight: 18,
  },
  accessCodeCard: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  accessCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accessCodeTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  accessCodeDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  payButton: {
    backgroundColor: "#9B7C56",
    borderRadius: 30,
    height: 56,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
