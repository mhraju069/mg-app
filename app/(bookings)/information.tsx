import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { AvoidKeyboard } from "@/components/ui/avoid-keyboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Card } from "@/components/ui/card";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { useBookingStore } from "@/utils/bookingStore";
import { router } from "expo-router";
import {
  ArrowRight,
  Clock,
  Users,
  ShieldCheck,
  Calendar as CalendarIcon,
  Sparkles,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Pressable } from "react-native";

export default function InformationScreen() {
  const { t } = useTranslation();
  const storeState = useBookingStore.getState();
  const brownGold = "#9B7C56";
  const textMuted = useColor("textMuted");

  const isActivity = storeState.serviceType === "activity" || Boolean(storeState.activityDetails);
  const act = storeState.activityDetails;

  const [fullName, setFullName] = useState(storeState.fullName || "Akash");
  const [email, setEmail] = useState(storeState.email || "akash@example.com");
  const [phone, setPhone] = useState(storeState.phone || "+31 6 12345678");
  const [specialRequests, setSpecialRequests] = useState(storeState.specialRequests || "");

  // Participants count for activity tickets
  const maxAllowedTickets = act?.availableSlots !== undefined ? act.availableSlots : Math.max(1, (act?.maxParticipants || 10) - (act?.bookedParticipants || 0));
  const [ticketCount, setTicketCount] = useState<number>(storeState.guestsCount || 1);

  const singlePrice = act?.price || storeState.price || 15;
  const totalCalculated = isActivity ? singlePrice * ticketCount : storeState.price;

  const handleContinue = () => {
    useBookingStore.setState({
      fullName,
      email,
      phone,
      specialRequests,
      guestsCount: isActivity ? ticketCount : storeState.guestsCount,
      price: totalCalculated,
    });
    router.push("/(bookings)/confirmation");
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={isActivity ? "Activity & Guest Details" : t("createBooking.information.title") || "Contact Details"}
          subtitle={
            isActivity
              ? "Select your participant tickets and verify reservation details"
              : t("createBooking.information.subtitle") || "Please confirm who the booking reservation is for"
          }
        />

        {/* ========================================================================= */}
        {/* ACTIVITY SESSION SUMMARY CARD (IDENTICAL TO WEB INFORMATION FLOW)         */}
        {/* ========================================================================= */}
        {isActivity && act && (
          <Card style={styles.activitySessionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{act.category || "Class"}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#059669" }}>
                ✓ Instant Confirmation
              </Text>
            </View>

            <Text style={styles.activityName}>{act.name}</Text>
            {act.description ? (
              <Text style={styles.activityDesc} numberOfLines={2}>
                {act.description}
              </Text>
            ) : null}

            {/* Schedule & Host Grid */}
            <View style={styles.activityMetaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Date & Schedule</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <CalendarIcon size={14} color={brownGold} />
                  <Text style={styles.metaValue}>
                    {act.date || storeState.date || "Scheduled Class"}
                  </Text>
                </View>
              </View>

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Time Slot</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Clock size={14} color={brownGold} />
                  <Text style={styles.metaValue}>
                    {act.startTime} - {act.endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Host / Guide</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <ShieldCheck size={14} color={brownGold} />
                  <Text style={styles.metaValue}>
                    {act.teacherHost || "Elena Rostova"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Number of Participants / Tickets Selection */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EBE3DA" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={styles.ticketsSectionTitle}>
                  Number of Tickets / Participants
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: brownGold }}>
                  €{singlePrice.toFixed(0)} / person
                </Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {Array.from({ length: Math.min(6, maxAllowedTickets) }, (_, i) => i + 1).map((num) => {
                  const isSel = ticketCount === num;
                  return (
                    <Pressable
                      key={num}
                      style={[
                        styles.ticketOption,
                        isSel && styles.ticketOptionActive,
                      ]}
                      onPress={() => setTicketCount(num)}
                    >
                      <Text style={[styles.ticketNumber, isSel && styles.ticketNumberActive]}>
                        {num}
                      </Text>
                      <Text style={[styles.ticketSub, isSel && styles.ticketSubActive]}>
                        {num === 1 ? "Ticket" : "Tickets"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Total Investment preview */}
              <View style={styles.investmentRow}>
                <Text style={styles.investmentLabel}>Total Activity Investment</Text>
                <Text style={styles.investmentAmount}>€{totalCalculated.toFixed(2)}</Text>
              </View>
            </View>
          </Card>
        )}

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
  activitySessionCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#FAF7F3",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
    marginBottom: 20,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(155, 124, 86, 0.12)",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9B7C56",
    textTransform: "uppercase",
  },
  activityName: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
    marginTop: 8,
  },
  activityDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 4,
  },
  activityMetaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EBE3DA",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9B7C56",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d1a17",
  },
  ticketsSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
  },
  ticketOption: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  ticketOptionActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  ticketNumberActive: {
    color: "#fff",
  },
  ticketSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  ticketSubActive: {
    color: "rgba(255,255,255,0.9)",
  },
  investmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#F9E4D0",
  },
  investmentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9B7C56",
    textTransform: "uppercase",
  },
  investmentAmount: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#9B7C56",
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
});
