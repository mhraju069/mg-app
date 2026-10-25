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
import { ArrowRight, AlertCircle } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

import { useBookingStore } from "@/utils/bookingStore";
import { API_BASE_URL } from "@/utils/constants";

export default function SelectDateScreen() {
  const storeState = useBookingStore.getState();
  const [selectedDate, setSelectedDate] = useState<string | null>(storeState.date || null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const background = useColor("background");
  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();

  // Today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  // Booked / fully blocked test dates
  const bookedDates = [
    "2026-02-04",
    "2026-02-11",
    "2026-03-18",
    "2026-03-25",
    "2026-02-07",
  ];

  // Check backend slot blocking when date selected
  const handleDateSelect = async (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsBlocked(false);
    setBlockedMessage(null);

    try {
      const serviceType = storeState.serviceType === "saltroom" ? "saltroom" : storeState.serviceType || "sauna";
      const res = await fetch(`${API_BASE_URL}/services/slots/?type=${serviceType}&date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        if (json.is_blocked) {
          setIsBlocked(true);
          setBlockedMessage(json.message || "This date is currently blocked for reservations.");
        } else if (json.is_closed || json?.data?.is_closed) {
          setIsBlocked(true);
          setBlockedMessage(json?.data?.info || json.message || "Service is closed on this date.");
        }
      }
    } catch (e) {
      console.warn("Date slot check notice:", e);
    }
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.selectDate.title") || "Select Date"}
          subtitle={t("createBooking.selectDate.subtitle") || "Choose an available reservation date"}
        />

        <Calendar
          hideExtraDays
          enableSwipeMonths
          minDate={todayStr}
          renderHeader={(date) => {
            const month = date.toString("MMMM yyyy");

            return (
              <View style={styles.customHeader}>
                <Text style={styles.monthName}>{month}</Text>

                <View style={{ flexDirection: "row", gap: 18, marginTop: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 18,
                        backgroundColor: "#FCF2E9",
                        borderWidth: 1,
                        borderColor: "#F9E4D0",
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: Fonts.serif,
                        fontSize: 14,
                        color: textMuted,
                      }}
                    >
                      {t("createBooking.selectDate.available") || "Available"}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 18,
                        backgroundColor: border,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: Fonts.serif,
                        fontSize: 14,
                        color: textMuted,
                      }}
                    >
                      {t("createBooking.selectDate.booked") || "Unavailable"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          dayComponent={({ date }) => {
            if (!date) return null;
            const dateStr = date.dateString;
            const isPast = dateStr < todayStr;
            const isBooked = bookedDates.includes(dateStr);
            const isSelected = selectedDate === dateStr;
            const isDisabled = isPast || isBooked;

            return (
              <Pressable
                disabled={isDisabled}
                onPress={() => handleDateSelect(dateStr)}
                style={[
                  styles.dayCircle,
                  isSelected && styles.selectedCircle,
                  isDisabled && styles.bookedCircle,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && { color: "white", fontWeight: "700" },
                    isDisabled && { color: "#CBD5E1" },
                  ]}
                >
                  {date.day}
                </Text>
              </Pressable>
            );
          }}
          theme={{
            calendarBackground: background,
            arrowColor: "#9B7C56",
            textMonthFontFamily: Fonts.serif,
            textMonthFontSize: 18,
            textMonthFontWeight: 600,
          }}
          style={{
            borderWidth: 1,
            borderRadius: 24,
            borderColor: border,
            paddingBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }}
        />

        {isBlocked && (
          <View style={styles.blockedAlert}>
            <AlertCircle size={18} color="#DC2626" />
            <Text style={styles.blockedAlertText}>{blockedMessage}</Text>
          </View>
        )}

        <Card style={styles.selectionSummary}>
          <Text variant="caption" style={{ color: textMuted }}>
            {t("createBooking.selectDate.selectedDate") || "Selected Date"}
          </Text>
          <Text style={styles.summaryValue}>{selectedDate || "Please pick a date"}</Text>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button
          onPress={() => {
            if (selectedDate && !isBlocked) {
              useBookingStore.setState({ date: selectedDate });
              router.push({
                pathname: "/(bookings)/select-time",
                params: { date: selectedDate },
              });
            }
          }}
          disabled={!selectedDate || isBlocked}
        >
          <Text>{t("createBooking.selectDate.continue") || "Continue"}</Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectionSummary: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
    color: "#9B7C56",
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#F9E4D0",
  },
  selectedCircle: {
    backgroundColor: "#9B7C56",
    borderWidth: 1,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  bookedCircle: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  customHeader: {
    paddingVertical: 10,
    alignItems: "center",
  },
  monthName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
  },
  blockedAlert: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  blockedAlertText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
});
