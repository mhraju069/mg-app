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
import { ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Calendar } from "react-native-calendars";

import { useBookingStore } from "@/utils/bookingStore";

export default function SelectDateScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const bookedDates = [
    "2026-02-04",
    "2026-02-11",
    "2026-03-18",
    "2026-03-25",
    "2026-02-07",
  ];
  const background = useColor("background");
  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const { t } = useTranslation();

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const markedDates = {
    ...(selectedDate && {
      [selectedDate]: {
        customStyles: {
          container: {
            backgroundColor: "#9B7C56",
            borderRadius: 20,
          },
          text: {
            color: "white",
            fontWeight: "700",
          },
        },
      },
    }),

    ...bookedDates.reduce((acc, date) => {
      acc[date] = {
        customStyles: {
          container: {
            backgroundColor: "#E5E7EB",
            borderRadius: 20,
          },
          text: {
            color: "#9CA3AF",
          },
        },
      };
      return acc;
    }, {} as any),
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header title={t("createBooking.selectDate.title")} subtitle={t("createBooking.selectDate.subtitle")} />

        <Calendar
          hideExtraDays
          enableSwipeMonths
          renderHeader={(date) => {
            const month = date.toString("MMMM yyyy");

            return (
              <View style={styles.customHeader}>
                <Text style={styles.monthName}>{month}</Text>

                {/* 👇 Your extra text here */}
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
                      {t("createBooking.selectDate.available")}
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
                      {t("createBooking.selectDate.booked")}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          dayComponent={({ date }) => {
            if (!date) return null;
            const isSelected = selectedDate === date.dateString;
            const isBooked = bookedDates.includes(date.dateString);

            return (
              <Pressable
                disabled={isBooked}
                onPress={() => setSelectedDate(date.dateString)}
                style={[
                  styles.dayCircle,
                  isSelected && styles.selectedCircle,
                  isBooked && styles.bookedCircle,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && { color: "white" },
                    isBooked && { color: "#9CA3AF" },
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

        <Card style={styles.selectionSummary}>
          <Text variant="caption" style={{ color: textMuted }}>
            {t("createBooking.selectDate.selectedDate")}
          </Text>
          <Text style={styles.summaryValue}>{selectedDate}</Text>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button
          onPress={() => {
            if (selectedDate) {
              useBookingStore.setState({ date: selectedDate });
              router.push({
                pathname: "/(bookings)/select-time",
                params: { date: selectedDate },
              });
            }
          }}
          disabled={!selectedDate}
        >
          <Text>{t("createBooking.selectDate.continue")}</Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    padding: 20,
    borderRadius: 24,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  availableIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FCD34D",
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
  calendar: {
    borderRadius: 24,
    paddingBottom: 10,
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
    backgroundColor: "#E5E7EB",
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

  headerSubText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
});
