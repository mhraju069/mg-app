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
import { useBookingStore } from "@/utils/bookingStore";
import { router } from "expo-router";
import {
  Calendar,
  Clock,
  Users,
  Zap,
  CreditCard,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable, ActivityIndicator } from "react-native";

export default function ConfirmationScreen() {
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const { t } = useTranslation();

  const storeState = useBookingStore.getState();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ideal">("card");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const priceVal = storeState.price || 0;
  const isFree = storeState.isFree || priceVal === 0;

  // Breakdown calculations
  const isSauna = storeState.serviceType === "sauna";
  const isPrivateSauna = isSauna && (storeState.saunaType === "private" || !storeState.isSharedSauna);
  const isSharedSauna = isSauna && (storeState.saunaType === "shared" || storeState.isSharedSauna);
  const durationHours = storeState.durationHours || 3;
  const basePrice = storeState.basePrice || (durationHours === 4 ? 350 : 90);
  const extraPersonFee = storeState.extraPersonFee || 50;
  const guestsCount = storeState.guestsCount || (isSharedSauna ? 1 : 2);
  const extraGuestsCount = Math.max(0, guestsCount - 2);
  const extrasList = storeState.selectedExtras || [];

  const handlePayAndConfirm = async () => {
    setIsProcessing(true);
    // Simulate real payment confirmation with API
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <>
        <BackHeader />
        <Layout>
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={54} color="#9B7C56" />
            </View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>
              We look forward to welcoming you at Heaven. Your booking details and automated access key have been reserved.
            </Text>

            <Card style={styles.successSummaryCard}>
              <Text style={styles.serviceName}>{storeState.serviceTitle}</Text>
              <View style={styles.detailRow}>
                <Calendar size={16} color={brownGold} />
                <Text style={styles.detailValue}>{storeState.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Clock size={16} color={brownGold} />
                <Text style={styles.detailValue}>{storeState.timeSlot}</Text>
              </View>
              <View style={styles.detailRow}>
                <Users size={16} color={brownGold} />
                <Text style={styles.detailValue}>{storeState.guestsCount} Guests</Text>
              </View>
            </Card>

            <Button
              style={styles.doneBtn}
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Back to Home</Text>
            </Button>
          </View>
        </Layout>
      </>
    );
  }

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.confirmation.title") || "Confirm & Pay"}
          subtitle={t("createBooking.confirmation.subtitle") || "Review your reserved session details before paying"}
        />

        {/* Booking Details Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.serviceName}>{storeState.serviceTitle}</Text>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
              <Calendar size={18} color={brownGold} />
            </View>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("booking.details.labels.date") || "Date"}
              </Text>
              <Text style={styles.detailValue}>{storeState.date}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
              <Clock size={18} color={brownGold} />
            </View>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("booking.details.labels.time") || "Time Slot"}
              </Text>
              <Text style={styles.detailValue}>{storeState.timeSlot}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
              <Users size={18} color={brownGold} />
            </View>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("booking.details.labels.guests") || "Guests"}
              </Text>
              <Text style={styles.detailValue}>{storeState.guestsCount} Persons</Text>
            </View>
          </View>
        </Card>

        {/* Pricing & Cost Breakdown */}
        <Card style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <CreditCard size={18} color={brownGold} />
            <Text style={styles.paymentTitle}>
              {t("createBooking.confirmation.labels.payment") || "Cost Breakdown"}
            </Text>
          </View>

          {isPrivateSauna ? (
            <View style={{ gap: 8 }}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {durationHours} Hours Base Session (2 Guests)
                </Text>
                <Text style={styles.priceValue}>€{basePrice.toFixed(2)}</Text>
              </View>

              {extraGuestsCount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Extra Guests ({extraGuestsCount} × €{extraPersonFee})
                  </Text>
                  <Text style={styles.priceValue}>
                    +€{(extraGuestsCount * extraPersonFee).toFixed(2)}
                  </Text>
                </View>
              )}

              {extrasList.map((ext) => (
                <View key={ext.id} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Extra: {ext.name}</Text>
                  <Text style={styles.priceValue}>+€{ext.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : isSharedSauna ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Shared Sauna ({guestsCount} × €30.00)
              </Text>
              <Text style={styles.priceValue}>€{priceVal.toFixed(2)}</Text>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{storeState.serviceTitle}</Text>
              <Text style={styles.priceValue}>
                {isFree ? "Free" : `€${priceVal.toFixed(2)}`}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {t("createBooking.confirmation.labels.total") || "Total Due"}
            </Text>
            <Text style={styles.totalValue}>
              {isFree ? "€0.00" : `€${priceVal.toFixed(2)}`}
            </Text>
          </View>
        </Card>

        {/* Payment Method Selector (Only if not free) */}
        {!isFree && (
          <Card style={styles.paymentMethodCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Lock size={15} color={brownGold} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1d1a17" }}>
                Secure Payment Method
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              <Pressable
                style={[
                  styles.methodRow,
                  paymentMethod === "card" && styles.methodRowActive,
                ]}
                onPress={() => setPaymentMethod("card")}
              >
                <CreditCard size={20} color={paymentMethod === "card" ? brownGold : "#71717A"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 14 }}>Credit / Debit Card</Text>
                  <Text style={{ fontSize: 12, color: "#6B5D54" }}>Visa, Mastercard, Amex</Text>
                </View>
                {paymentMethod === "card" && <CheckCircle2 size={18} color={brownGold} />}
              </Pressable>

              <Pressable
                style={[
                  styles.methodRow,
                  paymentMethod === "ideal" && styles.methodRowActive,
                ]}
                onPress={() => setPaymentMethod("ideal")}
              >
                <Sparkles size={20} color={paymentMethod === "ideal" ? brownGold : "#71717A"} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 14 }}>iDEAL Online Banking</Text>
                  <Text style={{ fontSize: 12, color: "#6B5D54" }}>ING, Rabobank, ABN AMRO</Text>
                </View>
                {paymentMethod === "ideal" && <CheckCircle2 size={18} color={brownGold} />}
              </Pressable>
            </View>
          </Card>
        )}

        {/* Access Code Notice */}
        <Card style={[styles.accessCodeCard, { backgroundColor: brownGold }]}>
          <View style={styles.accessCodeHeader}>
            <Zap size={20} color="white" />
            <Text style={styles.accessCodeTitle}>
              {t("access.label") || "Automated Door Access"}
            </Text>
          </View>
          <Text style={styles.accessCodeDesc}>
            {t("createBooking.confirmation.notes.accessCode") ||
              "Your 6-digit access code will be active 15 minutes before your reserved start time."}
          </Text>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handlePayAndConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {isFree
                ? "Confirm Table Reservation"
                : `Pay & Complete Booking (€${priceVal.toFixed(2)})`}
            </Text>
          )}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    gap: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  serviceName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3D2E24",
  },
  paymentCard: {
    padding: 20,
    borderRadius: 20,
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d1a17",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 13,
    color: "#6B5D54",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d1a17",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1EBE4",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d1a17",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#9B7C56",
    fontFamily: Fonts.serif,
  },
  paymentMethodCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBE3DA",
    backgroundColor: "#FDFBF8",
  },
  methodRowActive: {
    borderColor: "#9B7C56",
    backgroundColor: "rgba(155, 124, 86, 0.08)",
  },
  accessCodeCard: {
    padding: 20,
    borderRadius: 20,
    gap: 8,
  },
  accessCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accessCodeTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  accessCodeDesc: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
  successContainer: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F8F5F2",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  successSubtitle: {
    textAlign: "center",
    color: "#6B5D54",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  successSummaryCard: {
    width: "100%",
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    gap: 12,
    marginTop: 10,
  },
  doneBtn: {
    width: "100%",
    backgroundColor: "#9B7C56",
    borderRadius: 25,
    marginTop: 10,
  },
});
