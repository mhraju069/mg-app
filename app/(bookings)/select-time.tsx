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
import { router, useLocalSearchParams } from "expo-router";
import {
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  Users,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, ActivityIndicator } from "react-native";

export default function SelectTimeScreen() {
  const params = useLocalSearchParams();
  const storeState = useBookingStore.getState();
  const date = (params.date as string) || storeState.date || "2026-10-30";
  const serviceType = storeState.serviceType || "sauna";
  const isSharedSauna = storeState.isSharedSauna || storeState.saunaType === "shared";
  const durationHours = storeState.durationHours || 3;
  const guestsCount = storeState.guestsCount || (isSharedSauna ? 1 : 2);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [closedInfo, setClosedInfo] = useState<string>("");

  // Slots state
  const [privateSlots3h, setPrivateSlots3h] = useState<any[]>([]);
  const [privateSlots4h, setPrivateSlots4h] = useState<any[]>([]);
  const [sharedSlots, setSharedSlots] = useState<any[]>([]);
  const [genericSlots, setGenericSlots] = useState<string[]>([]);

  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setIsBlocked(false);
    setIsClosed(false);
    setClosedInfo("");

    const fetchSlots = async () => {
      try {
        const queryType = serviceType === "salt_room" ? "saltroom" : serviceType;
        const res = await fetch(`http://localhost/api/services/slots/?type=${queryType}&date=${date}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            if (json.is_blocked) {
              setIsBlocked(true);
            }
            if (json.is_closed || json?.data?.is_closed) {
              setIsClosed(true);
              setClosedInfo(json?.data?.info || json.message || "This service is closed on this date.");
            }

            const data = json?.data;
            if (data) {
              // 1. Private Sauna slots
              if (data.private_sauna?.slots) {
                const s3 = data.private_sauna.slots["3_hours"] || [];
                const s4 = data.private_sauna.slots["4_hours"] || [];
                setPrivateSlots3h(s3);
                setPrivateSlots4h(s4);

                const activeSlots = durationHours === 4 ? s4 : s3;
                if (activeSlots.length > 0 && !selectedTime) {
                  const first = `${activeSlots[0].start_time} - ${activeSlots[0].end_time}`;
                  setSelectedTime(first);
                }
              }

              // 2. Shared Sauna slots
              if (data.shared_sauna?.slots) {
                setSharedSlots(data.shared_sauna.slots);
                if (isSharedSauna && data.shared_sauna.slots.length > 0 && !selectedTime) {
                  const availableFirst = data.shared_sauna.slots.find(
                    (s: any) => !s.is_fully_booked && s.remaining_capacity >= guestsCount
                  ) || data.shared_sauna.slots[0];
                  setSelectedTime(`${availableFirst.start_time} - ${availableFirst.end_time}`);
                }
              }

              // 3. Generic slots (Salt room, activity, lunchroom, etc.)
              if (Array.isArray(data.slots)) {
                const gen = data.slots.map((s: any) =>
                  typeof s === "string" ? s : `${s.start_time || s.time} - ${s.end_time || ""}`.trim()
                );
                setGenericSlots(gen);
                if (!selectedTime && gen.length > 0) {
                  setSelectedTime(gen[0]);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch slots from API, using fallbacks:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [serviceType, date, durationHours, isSharedSauna, guestsCount]);

  const handleContinue = () => {
    useBookingStore.setState({ timeSlot: selectedTime });
    router.push({
      pathname: "/(bookings)/guests",
      params: {
        date,
        time: selectedTime,
      },
    });
  };

  const isSauna = serviceType === "sauna";

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.selectTime.title") || "Select Time Slot"}
          subtitle={
            isSauna
              ? isSharedSauna
                ? "Choose your 90-minute shared wellness session"
                : `Choose your ${durationHours}-hour exclusive sanctuary session`
              : t("createBooking.selectTime.subtitle") || "Choose your preferred arrival or session window"
          }
        />

        {/* Selected Date Card */}
        <Card style={styles.dateInfoCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text variant="caption" style={{ color: textMuted }}>
                {t("createBooking.selectDate.selectedDate") || "Selected Date"}
              </Text>
              <Text style={styles.dateValue}>{date}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Calendar size={18} color={brownGold} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: brownGold }}>
                {isSauna ? (isSharedSauna ? "Shared Sauna" : `Private Sauna (${durationHours}h)`) : serviceType}
              </Text>
            </View>
          </View>
        </Card>

        {/* Informative Banner */}
        {isSauna && !isSharedSauna && (
          <View style={styles.bufferBanner}>
            <View style={styles.bufferIconBox}>
              <Clock size={18} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bufferTitle}>
                Private Sauna ({durationHours} Hours Session)
              </Text>
              <Text style={styles.bufferDesc}>
                Automatic 30-minute cleaning buffer reserved after your time slot for ultimate hygiene and sanitation.
              </Text>
            </View>
          </View>
        )}

        {isSauna && isSharedSauna && (
          <View style={styles.bufferBanner}>
            <View style={styles.bufferIconBox}>
              <Users size={18} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bufferTitle}>
                Shared Sauna (1.5 Hours Session)
              </Text>
              <Text style={styles.bufferDesc}>
                Includes 15-minute changeover buffer. Real-time remaining seats shown per session.
              </Text>
            </View>
          </View>
        )}

        {/* Error / Blocked / Closed banners */}
        {isBlocked && (
          <View style={styles.alertCardBlocked}>
            <AlertTriangle size={22} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitleBlocked}>Date Blocked</Text>
              <Text style={styles.alertDescBlocked}>
                This date has been marked as unavailable by administration. Please select another date.
              </Text>
            </View>
          </View>
        )}

        {isClosed && (
          <View style={styles.alertCardClosed}>
            <Info size={22} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitleClosed}>Service Closed on This Date</Text>
              <Text style={styles.alertDescClosed}>{closedInfo}</Text>
            </View>
          </View>
        )}

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={{ marginTop: 12, color: textMuted }}>Checking live available slots...</Text>
          </View>
        ) : !isBlocked && !isClosed ? (
          <View style={{ gap: 14 }}>
            {/* 1. PRIVATE SAUNA SLOTS (3 Hours or 4 Hours matching duration choice) */}
            {isSauna && !isSharedSauna && (
              <View style={{ gap: 12 }}>
                {(() => {
                  const currentSlots = durationHours === 4 ? privateSlots4h : privateSlots3h;
                  if (currentSlots.length === 0) {
                    return (
                      <Card style={styles.emptyCard}>
                        <Text style={styles.emptyText}>
                          No {durationHours}-hour private sauna slots available for {date}.
                        </Text>
                      </Card>
                    );
                  }

                  return currentSlots.map((slot: any, idx: number) => {
                    const label = `${slot.start_time} - ${slot.end_time}`;
                    const isSelected = selectedTime === label;
                    return (
                      <Pressable
                        key={idx}
                        style={[
                          styles.slotCard,
                          isSelected && styles.slotCardActive,
                        ]}
                        onPress={() => setSelectedTime(label)}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <View>
                            <Text style={[styles.slotTimeText, isSelected && styles.slotTimeTextActive]}>
                              {label}
                            </Text>
                            <Text style={styles.slotBufferText}>
                              {slot.time_slot === "4_hours" ? "4-hour" : "3-hour"} private session • Cleaning buffer until {slot.buffer_end_time}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.radioIndicator,
                              isSelected && styles.radioIndicatorActive,
                            ]}
                          >
                            {isSelected && <CheckCircle2 size={18} color="#fff" />}
                          </View>
                        </View>
                      </Pressable>
                    );
                  });
                })()}
              </View>
            )}

            {/* 2. SHARED SAUNA SLOTS (90 mins sessions with remaining capacity badge) */}
            {isSauna && isSharedSauna && (
              <View style={{ gap: 12 }}>
                {sharedSlots.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No shared sauna sessions available for {date}.</Text>
                  </Card>
                ) : (
                  sharedSlots.map((slot: any, idx: number) => {
                    const label = `${slot.start_time} - ${slot.end_time}`;
                    const isSelected = selectedTime === label;
                    const remaining = slot.remaining_capacity ?? (slot.max_capacity - slot.booked_capacity);
                    const isFullyBooked = slot.is_fully_booked || remaining <= 0;
                    const notEnoughCapacity = !isFullyBooked && remaining < guestsCount;
                    const isDisabled = isFullyBooked || notEnoughCapacity;

                    return (
                      <Pressable
                        key={idx}
                        disabled={isDisabled}
                        style={[
                          styles.slotCard,
                          isSelected && styles.slotCardActive,
                          isDisabled && styles.slotCardDisabled,
                        ]}
                        onPress={() => setSelectedTime(label)}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <View>
                            <Text style={[styles.slotTimeText, isSelected && styles.slotTimeTextActive]}>
                              {label}
                            </Text>
                            <Text style={styles.slotBufferText}>
                              90m shared session • Changeover buffer until {slot.buffer_end_time}
                            </Text>
                          </View>

                          <View style={{ alignItems: "flex-end", gap: 4 }}>
                            {isFullyBooked ? (
                              <View style={styles.badgeSoldOut}>
                                <Text style={styles.badgeSoldOutText}>Fully Booked</Text>
                              </View>
                            ) : notEnoughCapacity ? (
                              <View style={styles.badgeWarn}>
                                <Text style={styles.badgeWarnText}>Only {remaining} left</Text>
                              </View>
                            ) : (
                              <View style={[styles.badgeAvailable, isSelected && { borderColor: brownGold }]}>
                                <Text style={styles.badgeAvailableText}>
                                  {remaining} {remaining === 1 ? "place" : "places"} remaining
                                </Text>
                              </View>
                            )}

                            {isSelected && (
                              <Text style={{ fontSize: 11, fontWeight: "700", color: brownGold }}>
                                Selected
                              </Text>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {/* 3. STANDARD / FALLBACK SLOTS */}
            {!isSauna && (
              <View style={styles.grid}>
                {(genericSlots.length > 0 ? genericSlots : [
                  "10:00 - 13:00",
                  "13:30 - 16:30",
                  "17:00 - 20:00",
                  "10:00 AM",
                  "11:30 AM",
                  "01:00 PM",
                  "02:30 PM",
                  "04:00 PM",
                ]).map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <Pressable
                      key={time}
                      style={[
                        styles.genericTimeSlot,
                        isSelected
                          ? { backgroundColor: "#D4C4B0", borderColor: brownGold, borderWidth: 1 }
                          : { backgroundColor: "#ECEEF1", borderWidth: 0 },
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Clock size={16} color={isSelected ? brownGold : "#71717A"} />
                      <Text
                        style={[
                          styles.genericTimeText,
                          isSelected && { color: "black", fontWeight: "700" },
                        ]}
                      >
                        {time}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* Selected Time Summary */}
        <Card style={styles.selectionSummary}>
          <Text variant="caption" style={{ color: textMuted }}>
            {t("createBooking.selectTime.selectedTime") || "Selected Time Slot"}
          </Text>
          <Text style={styles.summaryValue}>{selectedTime || "No slot selected"}</Text>
        </Card>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handleContinue} disabled={!selectedTime || isBlocked || isClosed}>
          <Text>{t("createBooking.selectTime.continue") || "Continue"}</Text>
          <ArrowRight size={18} color="#000" />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dateInfoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  dateValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
    marginTop: 2,
  },
  bufferBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    marginBottom: 16,
  },
  bufferIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  bufferTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d1a17",
  },
  bufferDesc: {
    fontSize: 11,
    color: "#6B5D54",
    marginTop: 2,
    lineHeight: 15,
  },
  alertCardBlocked: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
  },
  alertTitleBlocked: {
    fontSize: 14,
    fontWeight: "800",
    color: "#DC2626",
  },
  alertDescBlocked: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 2,
  },
  alertCardClosed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16,
  },
  alertTitleClosed: {
    fontSize: 14,
    fontWeight: "800",
    color: "#D97706",
  },
  alertDescClosed: {
    fontSize: 12,
    color: "#92400E",
    marginTop: 2,
  },
  slotCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
  },
  slotCardActive: {
    backgroundColor: "#FCF2E9",
    borderColor: "#9B7C56",
    shadowColor: "#9B7C56",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  slotCardDisabled: {
    backgroundColor: "#F4F4F5",
    borderColor: "#E4E4E7",
    opacity: 0.6,
  },
  slotTimeText: {
    fontSize: 17,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  slotTimeTextActive: {
    color: "#9B7C56",
  },
  slotBufferText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },
  radioIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  radioIndicatorActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  badgeSoldOut: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
  },
  badgeSoldOutText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  badgeWarn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  badgeWarnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
  },
  badgeAvailable: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeAvailableText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#059669",
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#92400E",
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  genericTimeSlot: {
    minWidth: "45%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  genericTimeText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
  },
  selectionSummary: {
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
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
