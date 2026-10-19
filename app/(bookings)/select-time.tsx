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
import { TIME_SLOTS } from "@/utils/constants";
import { router, useLocalSearchParams } from "expo-router";
import { Clock, ArrowRight } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";

export default function SelectTimeScreen() {
  const { date } = useLocalSearchParams();
  const [selectedTime, setSelectedTime] = useState("12:00 PM");
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.selectTime.title")}
          subtitle={t("createBooking.selectTime.subtitle")}
        />

        <Card style={styles.dateInfoCard}>
          <Text variant="caption" style={{ color: textMuted }}>
            {t("createBooking.selectDate.selectedDate")}
          </Text>
          <Text style={styles.dateValue}>{date}</Text>
        </Card>

        <View style={styles.grid}>
          {TIME_SLOTS.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <Pressable
                key={time}
                style={[
                  styles.timeSlot,
                  isSelected
                    ? { backgroundColor: "#D4C4B0" }
                    : { backgroundColor: "#ECEEF1" },
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Clock size={18} color={isSelected ? brownGold : "#71717A"} />
                <Text
                  style={[
                    styles.timeText,
                    isSelected && { color: "black", fontWeight: "700" },
                  ]}
                >
                  {time}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={styles.selectionSummary}>
          <Text variant="caption" style={{ color: textMuted }}>
            {t("createBooking.selectTime.selectedTime")}
          </Text>
          <Text style={styles.summaryValue}>{selectedTime}</Text>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button
          onPress={() =>
            router.push({
              pathname: "/(bookings)/guests",
              params: {
                date,
                time: selectedTime,
              },
            })
          }
        >
          <Text>{t("createBooking.selectTime.continue")}</Text>
          <ArrowRight size={18} color="#000" />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dateInfoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 4,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.serif,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center"
  },
  timeSlot: {
    width: "30%",
    height: 80,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#71717A",
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
    fontFamily: Fonts.serif,
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
