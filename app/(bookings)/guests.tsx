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
import { router, useLocalSearchParams } from "expo-router";
import { Minus, Plus, Users, ArrowRight, Sparkles } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";

import { useBookingStore } from "@/utils/bookingStore";

export default function GuestsScreen() {
  const params = useLocalSearchParams();
  const storeState = useBookingStore.getState();
  const date = (params.date as string) || storeState.date || "2026-10-30";
  const time = (params.time as string) || storeState.timeSlot || "10:00 - 13:00";
  const isSauna = storeState.serviceType === "sauna";
  const isPrivateSauna = isSauna && (storeState.saunaType === "private" || !storeState.isSharedSauna);
  const isSharedSauna = isSauna && (storeState.saunaType === "shared" || storeState.isSharedSauna);

  const minGuests = isPrivateSauna ? 2 : 1;
  const maxGuests = 6;
  const [guests, setGuests] = useState<number>(storeState.guestsCount || minGuests);

  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();

  // Recalculate price when guests count changes
  const basePrice = storeState.basePrice || (storeState.durationHours === 4 ? 350 : 90);
  const extraPersonFee = storeState.extraPersonFee || 50;
  const sharedPricePerson = 30;
  const extrasTotal = (storeState.selectedExtras || []).reduce((sum, e) => sum + e.price, 0);

  const calculatedPrice = isPrivateSauna
    ? basePrice + Math.max(0, guests - 2) * extraPersonFee + extrasTotal
    : isSharedSauna
    ? guests * sharedPricePerson
    : storeState.price;

  const handleContinue = () => {
    useBookingStore.setState({
      guestsCount: guests,
      price: calculatedPrice,
    });
    router.push("/(bookings)/information");
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.guests.title") || "Number of Guests"}
          subtitle={
            isPrivateSauna
              ? "Private sanctuary accommodates 2 to 6 guests (+€50 per extra guest above 2)"
              : isSharedSauna
              ? "Reserve places for your party in this 90-minute shared session"
              : t("createBooking.guests.subtitle") || "Select the number of people attending"
          }
        />

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text variant="caption" style={{ color: textMuted }}>
              {t("booking.details.labels.date") || "Date"}
            </Text>
            <Text style={styles.summaryValue}>{date}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text variant="caption" style={{ color: textMuted }}>
              {t("booking.details.labels.time") || "Time Slot"}
            </Text>
            <Text style={styles.summaryValue}>{time}</Text>
          </View>
        </Card>

        <Card style={styles.counterCard}>
          <View style={styles.iconCircle}>
            <Users size={32} color={brownGold} />
          </View>

          <Text style={[styles.label, { color: textMuted }]}>
            {isPrivateSauna ? "Private Group Size (2–6)" : "Number of Guests"}
          </Text>

          <View style={styles.counterRow}>
            <Pressable
              style={[
                styles.counterButton,
                guests <= minGuests && styles.disabledButton,
              ]}
              disabled={guests <= minGuests}
              onPress={() => setGuests(Math.max(minGuests, guests - 1))}
            >
              <Minus size={24} color="#71717A" />
            </Pressable>

            <Text style={styles.guestCount}>{guests}</Text>

            <Pressable
              style={[
                styles.counterButton,
                { backgroundColor: "#D4C4B0" },
                guests >= maxGuests && styles.disabledButton,
              ]}
              disabled={guests >= maxGuests}
              onPress={() => setGuests(Math.min(maxGuests, guests + 1))}
            >
              <Plus size={24} color="black" />
            </Pressable>
          </View>

          <Text variant="caption" style={{ color: textMuted }}>
            {isPrivateSauna
              ? guests > 2
                ? `Base 2 guests + ${guests - 2} extra (+€${(guests - 2) * extraPersonFee})`
                : "Base group rate (2 guests included)"
              : `Total Due: €${calculatedPrice.toFixed(2)}`}
          </Text>
        </Card>

        {/* Quick select pills */}
        <View style={styles.quickSelect}>
          <Text style={styles.sectionTitle}>
            {t("createBooking.guests.quickSelect") || "Quick Select"}
          </Text>
          <View style={styles.quickGrid}>
            {(isPrivateSauna ? [2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6]).map((n) => (
              <Pressable
                key={n}
                style={[
                  styles.quickItem,
                  guests === n
                    ? { backgroundColor: "#9B7C56", borderColor: "#9B7C56" }
                    : {
                        backgroundColor: "white",
                        borderWidth: 1,
                        borderColor: "#E4E4E7",
                      },
                ]}
                onPress={() => setGuests(n)}
              >
                <Text
                  style={[
                    styles.quickText,
                    guests === n && { color: "#fff", fontWeight: "700" },
                  ]}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Live recalculation badge */}
        <Card style={styles.recalcCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "800", color: brownGold, textTransform: "uppercase" }}>
                Updated Total
              </Text>
              <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                {storeState.serviceTitle}
              </Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", fontFamily: Fonts.serif, color: brownGold }}>
              €{calculatedPrice.toFixed(2)}
            </Text>
          </View>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handleContinue}>
          <Text>{t("createBooking.guests.continue") || "Continue"}</Text>
          <ArrowRight size={18} color="#000" />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  counterCard: {
    padding: 28,
    borderRadius: 24,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8F5F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    marginVertical: 8,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ECEEF1",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.4,
  },
  guestCount: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  quickSelect: {
    marginTop: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d1a17",
  },
  quickGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickItem: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickText: {
    fontSize: 15,
    color: "#3D2E24",
    fontWeight: "600",
  },
  recalcCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FCF2E9",
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
