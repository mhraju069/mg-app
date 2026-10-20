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
  UtensilsCrossed,
  Dumbbell,
  ChevronDown,
} from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
import { Pressable, StyleSheet, ActivityIndicator, Modal, TouchableOpacity } from "react-native";

export default function SelectTimeScreen() {
  const params = useLocalSearchParams();
  const storeState = useBookingStore.getState();
  const date = (params.date as string) || storeState.date || "2026-10-30";
  const serviceType = storeState.serviceType || "sauna";
  const isPackage = serviceType === "package" || serviceType === "packages";
  const isSauna = !isPackage && serviceType === "sauna";
  const isSaltRoom = !isPackage && (serviceType === "saltroom" || serviceType === "salt_room" || storeState.isSaltRoom);
  const isSharedSauna = isSauna && (storeState.isSharedSauna || storeState.saunaType === "shared");
  const durationHours = storeState.durationHours || 3;
  const guestsCount = storeState.guestsCount || (isSharedSauna || isSaltRoom ? 1 : 2);

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [closedInfo, setClosedInfo] = useState<string>("");

  // Slots state
  const [privateSlots3h, setPrivateSlots3h] = useState<any[]>([]);
  const [privateSlots4h, setPrivateSlots4h] = useState<any[]>([]);
  const [sharedSlots, setSharedSlots] = useState<any[]>([]);
  const [saltSlots, setSaltSlots] = useState<any[]>([]);
  const [genericSlots, setGenericSlots] = useState<string[]>([]);

  // Package Sub-Service Slots State (matching Web choose-time)
  const [packageSlotsData, setPackageSlotsData] = useState<any | null>(null);
  const [pkgSaunaSlot, setPkgSaunaSlot] = useState<string | null>(
    storeState.packageSelections?.saunaSlot
      ? `${storeState.packageSelections.saunaSlot.startTime} - ${storeState.packageSelections.saunaSlot.endTime}`
      : null
  );
  const [pkgSaunaType, setPkgSaunaType] = useState<"private" | "shared">("private");
  const [pkgLunchTime, setPkgLunchTime] = useState<string>(
    storeState.packageSelections?.lunchroomTime || ""
  );
  const [showLunchDropdown, setShowLunchDropdown] = useState<boolean>(false);
  const [pkgSaltRoomSlot, setPkgSaltRoomSlot] = useState<string | null>(
    storeState.packageSelections?.saltRoomSlot
      ? `${storeState.packageSelections.saltRoomSlot.startTime} - ${storeState.packageSelections.saltRoomSlot.endTime || ""}`
      : null
  );
  const [pkgSelectedActivityId, setPkgSelectedActivityId] = useState<number | null>(
    storeState.packageSelections?.activitySession?.id || null
  );

  const includedServices: string[] = storeState.packageSelections?.includedServices || [];
  const normalizedServices = includedServices.map((s) => s.toLowerCase().replace(/[\s_-]+/g, ""));
  const packageIncludesSauna = isPackage && (
    normalizedServices.some((s) => s.includes("sauna")) || !includedServices.length
  );
  const packageIncludesLunchroom = isPackage && (
    normalizedServices.some((s) => s.includes("lunchroom") || s.includes("lunch")) || !includedServices.length
  );
  const packageIncludesSaltRoom = isPackage && (
    normalizedServices.some((s) => s.includes("salt") || s.includes("saltroom"))
  );
  const packageIncludesActivity = isPackage && (
    normalizedServices.some((s) => s.includes("activity") || s.includes("yoga"))
  );

  // Dynamically compute Lunchroom 1-hour interval slots from backend open_time and close_time
  const dynamicLunchSlots = useMemo(() => {
    const openTime = packageSlotsData?.lunchroom?.open_time || "06:00";
    const closeTime = packageSlotsData?.lunchroom?.close_time || "23:59";

    const [startH, startM] = openTime.split(":").map(Number);
    const [endH, endM] = closeTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(endH)) {
      return ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
    }

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    if (startMinutes >= endMinutes) {
      return ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
    }

    const slots: string[] = [];
    for (let m = startMinutes; m <= endMinutes; m += 60) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
    return slots.length > 0 ? slots : ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
  }, [packageSlotsData?.lunchroom?.open_time, packageSlotsData?.lunchroom?.close_time]);

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
        if (isPackage) {
          const res = await fetch(`http://localhost/api/services/slots/?type=package&date=${date}`);
          if (res.ok) {
            const json = await res.json();
            if (isMounted) {
              if (json.is_blocked) setIsBlocked(true);
              if (json.is_closed || json?.data?.is_closed) {
                setIsClosed(true);
                setClosedInfo(json?.data?.info || json.message || "Packages are closed on this date.");
              }
              const pData = json?.data;
              setPackageSlotsData(pData);

              // Auto-select initial slots if available
              if (pData?.sauna?.private_sauna?.slots) {
                const s3 = pData.sauna.private_sauna.slots["3_hours"] || [];
                const s4 = pData.sauna.private_sauna.slots["4_hours"] || [];
                const all = [...s3, ...s4];
                if (all.length > 0 && !pkgSaunaSlot) {
                  setPkgSaunaSlot(`${all[0].start_time} - ${all[0].end_time}`);
                }
              }
              if (pData?.saltroom?.slots && Array.isArray(pData.saltroom.slots) && pData.saltroom.slots.length > 0 && !pkgSaltRoomSlot) {
                const firstAvail = pData.saltroom.slots.find((s: any) => !s.is_fully_booked) || pData.saltroom.slots[0];
                setPkgSaltRoomSlot(`${firstAvail.start_time} - ${firstAvail.end_time}`);
              }
              if (pData?.activities && Array.isArray(pData.activities) && pData.activities.length > 0 && !pkgSelectedActivityId) {
                const firstAct = pData.activities.find((a: any) => a.available_slots > 0) || pData.activities[0];
                setPkgSelectedActivityId(firstAct.id);
              }
              if (pData?.lunchroom?.open_time && !pkgLunchTime) {
                setPkgLunchTime(pData.lunchroom.open_time.slice(0, 5));
              }
            }
          }
          return;
        }

        const queryType = isSaltRoom ? "saltroom" : serviceType;
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

              // 3. Salt Room slots (90/60m sessions with remaining capacity)
              if (isSaltRoom) {
                const sSlots = data.slots || data.saltroom?.slots || [];
                if (Array.isArray(sSlots) && sSlots.length > 0) {
                  setSaltSlots(sSlots);
                  if (!selectedTime) {
                    const firstAvail = sSlots.find((s: any) => !s.is_fully_booked && s.remaining_capacity >= guestsCount) || sSlots[0];
                    setSelectedTime(`${firstAvail.start_time} - ${firstAvail.end_time}`);
                  }
                }
              }

              // 4. Generic slots (activity, lunchroom, etc.)
              if (!isSaltRoom && !isSauna && Array.isArray(data.slots)) {
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
  }, [serviceType, isSaltRoom, isPackage, date, durationHours, isSharedSauna, guestsCount]);

  const handleContinue = () => {
    if (isPackage) {
      let saunaSlotData: any = undefined;
      if (pkgSaunaSlot) {
        const parts = pkgSaunaSlot.split(" - ");
        saunaSlotData = {
          type: pkgSaunaType,
          startTime: parts[0] || "",
          endTime: parts[1] || "",
        };
      }

      let saltRoomSlotData: any = undefined;
      if (pkgSaltRoomSlot) {
        const parts = pkgSaltRoomSlot.split(" - ");
        saltRoomSlotData = {
          startTime: parts[0] || "",
          endTime: parts[1] || "",
        };
      }

      let activitySessionData: any = undefined;
      const actList: any[] = packageSlotsData?.activities || [];
      if (pkgSelectedActivityId && actList.length > 0) {
        const found = actList.find((a: any) => a.id === pkgSelectedActivityId);
        if (found) {
          activitySessionData = {
            id: found.id,
            title: found.title,
            startTime: found.open_time,
            endTime: found.close_time,
            host: found.host,
          };
        }
      }

      const mainTime = pkgSaunaSlot || pkgSaltRoomSlot || pkgLunchTime || "Package Scheduled";

      useBookingStore.setState({
        timeSlot: mainTime,
        packageSelections: {
          ...storeState.packageSelections,
          saunaSlot: saunaSlotData,
          saltRoomSlot: saltRoomSlotData,
          lunchroomTime: pkgLunchTime,
          activitySession: activitySessionData,
        },
      });

      router.push("/(bookings)/information");
      return;
    }

    useBookingStore.setState({ timeSlot: selectedTime });

    // If Salt Room, pass type and guests count were already chosen in step 1, skip redundant guests screen
    if (isSaltRoom) {
      router.push("/(bookings)/information");
    } else {
      router.push({
        pathname: "/(bookings)/guests",
        params: {
          date,
          time: selectedTime,
        },
      });
    }
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={t("createBooking.selectTime.title") || "Select Time Slot"}
          subtitle={
            isSaltRoom
              ? "Choose your 1-hour pure halotherapy session window (10m changeover buffer)"
              : isSauna
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
                {isSaltRoom
                  ? "Salt Room (1h)"
                  : isSauna
                  ? isSharedSauna
                    ? "Shared Sauna"
                    : `Private Sauna (${durationHours}h)`
                  : serviceType}
              </Text>
            </View>
          </View>
        </Card>

        {/* Informative Banner */}
        {isSaltRoom && (
          <View style={styles.bufferBanner}>
            <View style={styles.bufferIconBox}>
              <Clock size={18} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bufferTitle}>
                Salt Room Session (1 Hour + 10 Mins Buffer)
              </Text>
              <Text style={styles.bufferDesc}>
                Includes 10-minute automated ventilation and salt particle recharge buffer. Strict 2 persons per session.
              </Text>
            </View>
          </View>
        )}

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
            {/* 1. SALT ROOM SLOTS (Identical to Web choose-time) */}
            {isSaltRoom && (
              <View style={{ gap: 12 }}>
                {saltSlots.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No Salt Room slots available on {date}.</Text>
                  </Card>
                ) : (
                  saltSlots.map((slot: any, idx: number) => {
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
                              1h session • Buffer until {slot.buffer_end_time}
                            </Text>
                          </View>

                          <View style={{ alignItems: "flex-end", gap: 4 }}>
                            {isFullyBooked ? (
                              <View style={styles.badgeSoldOut}>
                                <Text style={styles.badgeSoldOutText}>Full (0/{slot.max_capacity || 2})</Text>
                              </View>
                            ) : notEnoughCapacity ? (
                              <View style={styles.badgeWarn}>
                                <Text style={styles.badgeWarnText}>Only {remaining} left</Text>
                              </View>
                            ) : (
                              <View style={[styles.badgeAvailable, isSelected && { borderColor: brownGold }]}>
                                <Text style={styles.badgeAvailableText}>
                                  {remaining} {remaining === 1 ? "spot left" : "spots left"}
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

            {/* 2. PRIVATE SAUNA SLOTS */}
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

            {/* 3. SHARED SAUNA SLOTS */}
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

            {/* 4. MULTI-SERVICE PACKAGE SLOTS (MATCHES WEB CHOOSE-TIME MULTI-STEP FLOW) */}
            {isPackage && (
              <View style={{ gap: 16 }}>
                {/* 4.1 Sauna Sub-Service Slot (If included) */}
                {packageIncludesSauna && packageSlotsData?.sauna && (
                  <Card style={styles.packageSubServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>1</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subServiceTitle}>
                          Sauna Session Time Slot
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          {pkgSaunaType === "shared" ? "Shared sauna • 90 mins" : "Private sanctuary session"}
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData.sauna.is_closed ? (
                      <View style={styles.subServiceClosedBox}>
                        <Info size={16} color="#D97706" />
                        <Text style={styles.subServiceClosedText}>Sauna is closed on this date.</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {/* Private sauna slots */}
                        {(() => {
                          const p3 = packageSlotsData.sauna.private_sauna?.slots?.["3_hours"] || [];
                          const p4 = packageSlotsData.sauna.private_sauna?.slots?.["4_hours"] || [];
                          const allSlots = [...p3, ...p4];

                          if (allSlots.length === 0) {
                            return (
                              <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic" }}>
                                No private sauna slots available on this date.
                              </Text>
                            );
                          }

                          return allSlots.map((slot: any, idx: number) => {
                            const label = `${slot.start_time} - ${slot.end_time}`;
                            const isSel = pkgSaunaSlot === label;
                            return (
                              <Pressable
                                key={idx}
                                onPress={() => setPkgSaunaSlot(label)}
                                style={[
                                  styles.packageSlotBtn,
                                  isSel && styles.packageSlotBtnActive,
                                ]}
                              >
                                <View>
                                  <Text style={[styles.packageSlotBtnTime, isSel && styles.packageSlotBtnTimeActive]}>
                                    {label}
                                  </Text>
                                  <Text style={styles.packageSlotBtnSub}>
                                    {slot.time_slot === "4_hours" ? "4-hour" : "3-hour"} private session • Buffer until {slot.buffer_end_time}
                                  </Text>
                                </View>
                                {isSel && <CheckCircle2 size={18} color="#9B7C56" />}
                              </Pressable>
                            );
                          });
                        })()}
                      </View>
                    )}
                  </Card>
                )}

                {/* 4.2 Lunchroom Dining Arrival (If included) */}
                {packageIncludesLunchroom && (
                  <Card style={styles.packageSubServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>2</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subServiceTitle}>
                          Lunchroom Preferred Dining Arrival
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          {packageSlotsData?.lunchroom?.open_time && packageSlotsData?.lunchroom?.close_time
                            ? `Operating hours: ${packageSlotsData.lunchroom.open_time} - ${packageSlotsData.lunchroom.close_time}`
                            : "Flexible dining during daytime hours (11:00 - 15:00)"}
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData?.lunchroom?.is_closed ? (
                      <View style={styles.subServiceClosedBox}>
                        <Info size={16} color="#D97706" />
                        <Text style={styles.subServiceClosedText}>Lunchroom is closed on this date.</Text>
                      </View>
                    ) : (
                      <View style={{ marginTop: 12, gap: 10 }}>
                        {/* Interactive Dropdown Selector for Compact Display */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setShowLunchDropdown(true)}
                          style={styles.lunchDropdownButton}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <View style={styles.lunchDropdownIconCircle}>
                              <UtensilsCrossed size={16} color="#9B7C56" />
                            </View>
                            <View>
                              <Text style={styles.lunchDropdownLabel}>Selected Arrival Time</Text>
                              <Text style={styles.lunchDropdownValue}>
                                {pkgLunchTime ? `${pkgLunchTime} Arrival` : "Select Arrival Time"}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.lunchDropdownChangeText}>Change</Text>
                            <ChevronDown size={16} color="#9B7C56" />
                          </View>
                        </TouchableOpacity>

                        {/* Quick-Pick 1-Hour Interval Pills */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                          {dynamicLunchSlots.map((tStr) => {
                            const isSel = pkgLunchTime === tStr;
                            return (
                              <Pressable
                                key={tStr}
                                onPress={() => setPkgLunchTime(tStr)}
                                style={[
                                  styles.lunchPill,
                                  isSel && styles.lunchPillActive,
                                ]}
                              >
                                <UtensilsCrossed size={12} color={isSel ? "#fff" : "#9B7C56"} />
                                <Text style={[styles.lunchPillText, isSel && styles.lunchPillTextActive]}>
                                  {tStr}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </Card>
                )}

                {/* 4.3 Salt Room Session (If included) */}
                {packageIncludesSaltRoom && (
                  <Card style={styles.packageSubServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>3</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subServiceTitle}>
                          Salt Room Session
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          45-minute aerosol halotherapy session
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData?.saltroom?.slots && Array.isArray(packageSlotsData.saltroom.slots) && packageSlotsData.saltroom.slots.length > 0 ? (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {packageSlotsData.saltroom.slots.map((slot: any, idx: number) => {
                          const label = `${slot.start_time} - ${slot.end_time}`;
                          const isSel = pkgSaltRoomSlot === label;
                          const isSoldOut = slot.is_fully_booked || slot.remaining_capacity <= 0;
                          return (
                            <Pressable
                              key={idx}
                              disabled={isSoldOut}
                              onPress={() => setPkgSaltRoomSlot(label)}
                              style={[
                                styles.packageSlotBtn,
                                isSel && styles.packageSlotBtnActive,
                                isSoldOut && { opacity: 0.5 },
                              ]}
                            >
                              <View>
                                <Text style={[styles.packageSlotBtnTime, isSel && styles.packageSlotBtnTimeActive]}>
                                  {label}
                                </Text>
                                <Text style={styles.packageSlotBtnSub}>
                                  {isSoldOut ? "Sold Out" : `${slot.remaining_capacity} capacity remaining`}
                                </Text>
                              </View>
                              {isSel && <CheckCircle2 size={18} color="#9B7C56" />}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginTop: 8 }}>
                        No scheduled salt room sessions on this date.
                      </Text>
                    )}
                  </Card>
                )}

                {/* 4.4 Activities on Date (If included) */}
                {packageIncludesActivity && (
                  <Card style={styles.packageSubServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>4</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subServiceTitle}>
                          Activity Session
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          Scheduled wellness studio activity
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData?.activities && Array.isArray(packageSlotsData.activities) && packageSlotsData.activities.length > 0 ? (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {packageSlotsData.activities.map((act: any) => {
                          const isSel = pkgSelectedActivityId === act.id;
                          const isSoldOut = act.available_slots <= 0;
                          return (
                            <Pressable
                              key={act.id}
                              disabled={isSoldOut}
                              onPress={() => setPkgSelectedActivityId(act.id)}
                              style={[
                                styles.packageSlotBtn,
                                isSel && styles.packageSlotBtnActive,
                                isSoldOut && { opacity: 0.5 },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.packageSlotBtnTime, isSel && styles.packageSlotBtnTimeActive]}>
                                  {act.title}
                                </Text>
                                <Text style={styles.packageSlotBtnSub}>
                                  {act.open_time} - {act.close_time} • Host: {act.host || "Wellness Guide"}
                                </Text>
                              </View>
                              {isSel && <CheckCircle2 size={18} color="#9B7C56" />}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginTop: 8 }}>
                        No activities scheduled for this date.
                      </Text>
                    )}
                  </Card>
                )}
              </View>
            )}

            {/* 5. STANDARD / FALLBACK SLOTS */}
            {!isSauna && !isSaltRoom && !isPackage && (
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
            {isPackage ? "Scheduled Package Times" : t("createBooking.selectTime.selectedTime") || "Selected Time Slot"}
          </Text>
          {isPackage ? (
            <View style={{ gap: 4, marginTop: 4 }}>
              {packageIncludesSauna && (
                <Text style={styles.packageSummaryLine}>
                  • Sauna: <Text style={{ color: brownGold, fontWeight: "700" }}>{pkgSaunaSlot || "Pending selection"}</Text>
                </Text>
              )}
              {packageIncludesLunchroom && (
                <Text style={styles.packageSummaryLine}>
                  • Lunchroom: <Text style={{ color: brownGold, fontWeight: "700" }}>{pkgLunchTime || "12:30"} Arrival</Text>
                </Text>
              )}
              {packageIncludesSaltRoom && (
                <Text style={styles.packageSummaryLine}>
                  • Salt Room: <Text style={{ color: brownGold, fontWeight: "700" }}>{pkgSaltRoomSlot || "Pending selection"}</Text>
                </Text>
              )}
              {packageIncludesActivity && (
                <Text style={styles.packageSummaryLine}>
                  • Activity: <Text style={{ color: brownGold, fontWeight: "700" }}>{pkgSelectedActivityId ? "Session Selected" : "Pending selection"}</Text>
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.summaryValue}>{selectedTime || "No slot selected"}</Text>
          )}
        </Card>

        {/* Lunchroom Arrival Time Dropdown Picker Modal */}
        <Modal
          visible={showLunchDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLunchDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <UtensilsCrossed size={18} color="#9B7C56" />
                  <Text style={styles.modalTitle}>Select Lunchroom Arrival</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowLunchDropdown(false)}
                  style={styles.modalCloseBtn}
                >
                  <Text style={{ fontSize: 16, color: "#64748B", fontWeight: "700" }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                Operating Hours: {packageSlotsData?.lunchroom?.open_time || "06:00"} – {packageSlotsData?.lunchroom?.close_time || "23:59"}. Pick your preferred 1-hour interval dining arrival:
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {dynamicLunchSlots.map((timeStr) => {
                  const isSel = pkgLunchTime === timeStr;
                  return (
                    <TouchableOpacity
                      key={timeStr}
                      onPress={() => {
                        setPkgLunchTime(timeStr);
                        setShowLunchDropdown(false);
                      }}
                      style={[
                        styles.dropdownSlotPill,
                        isSel && styles.dropdownSlotPillActive,
                      ]}
                    >
                      <UtensilsCrossed size={14} color={isSel ? "#fff" : "#9B7C56"} />
                      <Text style={[styles.dropdownSlotPillText, isSel && styles.dropdownSlotPillTextActive]}>
                        {timeStr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button
          onPress={handleContinue}
          disabled={
            isBlocked ||
            isClosed ||
            (isPackage
              ? (packageIncludesSauna && !pkgSaunaSlot && packageSlotsData?.sauna && !packageSlotsData.sauna.is_closed)
              : !selectedTime)
          }
        >
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
  // Package Sub-Service Scheduling Styles
  packageSubServiceCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FAF7F2",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  subServiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#9B7C56",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  subServiceTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  subServiceDesc: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  subServiceClosedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 10,
  },
  subServiceClosedText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
  },
  packageSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  packageSlotBtnActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#FCF2E9",
  },
  packageSlotBtnTime: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d1a17",
  },
  packageSlotBtnTimeActive: {
    color: "#9B7C56",
  },
  packageSlotBtnSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  lunchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  lunchPillActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#9B7C56",
  },
  lunchPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  lunchPillTextActive: {
    color: "#fff",
  },
  packageSummaryLine: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  lunchDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  lunchDropdownIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#FCF2E9",
    justifyContent: "center",
    alignItems: "center",
  },
  lunchDropdownLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  lunchDropdownValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d1a17",
    marginTop: 1,
  },
  lunchDropdownChangeText: {
    fontSize: 12,
    color: "#9B7C56",
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownSlotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FAF7F2",
  },
  dropdownSlotPillActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#9B7C56",
  },
  dropdownSlotPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  dropdownSlotPillTextActive: {
    color: "#fff",
  },
});
