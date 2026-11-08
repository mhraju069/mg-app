import { appFetch } from '@/utils/apiClient';
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
import { API_BASE_URL } from "@/utils/constants";
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
  const includedServices: string[] = storeState.packageSelections?.includedServices || [];
  const normalizedServices = includedServices.map((s) => s.toLowerCase().replace(/[\s_-]+/g, ""));

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
  const [packageRequestError, setPackageRequestError] = useState<string | null>(null);
  const [retryPackageRequest, setRetryPackageRequest] = useState(0);
  const [pkgSaunaSlot, setPkgSaunaSlot] = useState<string | null>(
    storeState.packageSelections?.saunaSlot
      ? `${storeState.packageSelections.saunaSlot.startTime} - ${storeState.packageSelections.saunaSlot.endTime}`
      : null
  );
  const [pkgSaunaType, setPkgSaunaType] = useState<"private" | "shared">(
    normalizedServices.some((s) => s.includes("shared") || s === "normalsauna") && !normalizedServices.some((s) => s.includes("private") || s === "vipsauna")
      ? "shared"
      : "private"
  );
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

  const packageId = storeState.packageSelections?.packageId;
  const packageIncludesSauna = isPackage && normalizedServices.some((s) => s.includes("sauna"));
  const packageIncludesLunchroom = isPackage && normalizedServices.some((s) => s.includes("lunchroom") || s === "lunch");
  const packageIncludesSaltRoom = isPackage && normalizedServices.some((s) => s.includes("saltroom") || s === "salt");
  const packageIncludesActivity = isPackage && normalizedServices.some((s) => s.includes("activity") || s.includes("activities"));
  const packageHasBookableServices = packageIncludesSauna || packageIncludesLunchroom || packageIncludesSaltRoom || packageIncludesActivity;

  const mapPackageRequestError = (status: number, payload: any) => {
    const rawMessage = String(payload?.message || payload?.detail || payload?.error || "").toLowerCase();
    if (rawMessage.includes("package_id")) return t("bookingFlow.arrangementFlow.packageIdMissing");
    if (rawMessage.includes("package not found")) return t("bookingFlow.arrangementFlow.packageNotFound");
    if (rawMessage.includes("no supported booking services") || rawMessage.includes("not included")) return t("bookingFlow.arrangementFlow.noBookableServices");
    if (status >= 500) return t("bookingFlow.arrangementFlow.packageServerError");
    if (status === 0) return t("bookingFlow.arrangementFlow.packageNetworkError");
    return t("bookingFlow.arrangementFlow.packageRequestFailed");
  };

  // Dynamically compute Lunchroom 1-hour interval slots from backend open_time and close_time
  const dynamicLunchSlots = useMemo(() => {
    const openTime = packageSlotsData?.lunchroom?.open_time;
    const closeTime = packageSlotsData?.lunchroom?.close_time;
    if (!openTime || !closeTime) return [];

    const [startH, startM] = openTime.split(":").map(Number);
    const [endH, endM] = closeTime.split(":").map(Number);
    if (isNaN(startH) || isNaN(endH)) {
      return [];
    }

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);
    if (startMinutes >= endMinutes) {
      return [];
    }

    const slots: string[] = [];
    for (let m = startMinutes; m <= endMinutes; m += 60) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }, [packageSlotsData?.lunchroom?.open_time, packageSlotsData?.lunchroom?.close_time]);

  const packageActivitiesList: any[] = Array.isArray(packageSlotsData?.activities)
    ? packageSlotsData.activities
    : packageSlotsData?.activities?.activities || [];
  const packageActivitiesClosed = Boolean(packageSlotsData?.activities?.is_closed);
  const getPackageServiceName = (...serviceRecords: any[]) => {
    for (const record of serviceRecords) {
      const name = record?.service_name_form_api
        || record?.serviceNameFormApi
        || record?.service_name
        || record?.name
        || record?.title;
      if (typeof name === "string" && name.trim()) return name.trim();
    }
    return "";
  };
  const packageSaunaSlots = pkgSaunaType === "shared"
    ? packageSlotsData?.sauna?.shared_sauna?.slots || []
    : [
        ...(packageSlotsData?.sauna?.private_sauna?.slots?.["3_hours"] || []),
        ...(packageSlotsData?.sauna?.private_sauna?.slots?.["4_hours"] || []),
      ];
  const packageSaunaAvailableSlots = packageSaunaSlots.filter((slot: any) =>
    pkgSaunaType === "shared"
      ? !slot.is_fully_booked && (slot.remaining_capacity ?? 0) >= guestsCount
      : !slot.is_fully_booked
  );
  const packageHasReturnedServices = Boolean(packageSlotsData && [
    "sauna", "private_sauna", "shared_sauna", "lunchroom", "saltroom", "activities",
  ].some((key) => packageSlotsData[key] !== undefined && packageSlotsData[key] !== null));
  const packageHasNoBookableResponse = isPackage && packageSlotsData !== null && !packageHasReturnedServices;

  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const { t } = useTranslation();
  const saunaApiServiceName = getPackageServiceName(
    packageSlotsData?.sauna,
    packageSlotsData?.sauna?.private_sauna,
    packageSlotsData?.sauna?.shared_sauna,
  ) || t(pkgSaunaType === "shared" ? "bookingFlow.arrangementFlow.sharedSauna" : "bookingFlow.arrangementFlow.privateSauna");
  const lunchroomApiServiceName = getPackageServiceName(packageSlotsData?.lunchroom)
    || t("bookingFlow.arrangementFlow.lunchroomService");
  const saltRoomApiServiceName = getPackageServiceName(packageSlotsData?.saltroom)
    || t("bookingFlow.arrangementFlow.saltRoomService");
  const activityApiServiceName = getPackageServiceName(
    ...packageActivitiesList.filter((activity: any) => activity.id === pkgSelectedActivityId),
    ...packageActivitiesList,
  ) || t("bookingFlow.arrangementFlow.activityService");

  useEffect(() => {
    let isMounted = true;

    const fetchSlots = async () => {
      setLoading(true);
      setIsBlocked(false);
      setIsClosed(false);
      setClosedInfo("");
      setPackageRequestError(null);
      try {
        if (isPackage) {
          if (!packageHasBookableServices) {
            setPackageSlotsData({});
            setLoading(false);
            return;
          }
          if (!packageId) {
            setPackageRequestError(mapPackageRequestError(400, { message: "package_id is required" }));
            setLoading(false);
            return;
          }
          const requestUrl = `${API_BASE_URL}/services/slots/?type=package&date=${encodeURIComponent(date)}&package_id=${encodeURIComponent(String(packageId))}`;
          console.log("[DEV LOG - PACKAGE SLOTS REQUEST]", { url: requestUrl, method: "GET", body: null });
          const res = await appFetch(requestUrl);
          const json = await res.json().catch(() => ({}));
          console.log("[DEV LOG - PACKAGE SLOTS RESPONSE]", { status: res.status, payload: json });
          if (res.ok && json?.is_blocked) {
            if (isMounted) {
              setIsBlocked(true);
              setPackageSlotsData({});
            }
            return;
          }
          if (res.ok && (json?.is_closed || json?.data?.is_closed)) {
            if (isMounted) {
              setIsClosed(true);
              setClosedInfo(json?.data?.info || json.message || "");
              setPackageSlotsData(json?.data || {});
            }
            return;
          }
          if (!res.ok || json?.success === false) {
            if (isMounted) {
              setPackageSlotsData(null);
              setPackageRequestError(mapPackageRequestError(res.status, json));
            }
            return;
          }
          if (isMounted) {
            setIsBlocked(Boolean(json.is_blocked));
            setIsClosed(Boolean(json.is_closed || json?.data?.is_closed));
            setClosedInfo(json?.data?.info || json.message || "");
            const rawData = json?.data || {};
            const pData = {
              ...rawData,
              sauna: rawData.sauna || ((rawData.private_sauna || rawData.shared_sauna) ? {
                private_sauna: rawData.private_sauna || null,
                shared_sauna: rawData.shared_sauna || null,
                is_closed: (!rawData.private_sauna || Boolean(rawData.private_sauna.is_closed)) && (!rawData.shared_sauna || Boolean(rawData.shared_sauna.is_closed)),
              } : undefined),
            };
            setPackageSlotsData(pData);

            const privateSlots = [...(pData.sauna?.private_sauna?.slots?.["3_hours"] || []), ...(pData.sauna?.private_sauna?.slots?.["4_hours"] || [])].filter((slot: any) => !slot.is_fully_booked);
            const sharedSlotOptions = (pData.sauna?.shared_sauna?.slots || []).filter((slot: any) => !slot.is_fully_booked && (slot.remaining_capacity ?? 0) >= guestsCount);
            const saunaOptions = pData.sauna?.is_closed
              ? []
              : (pkgSaunaType === "shared" ? sharedSlotOptions : privateSlots);
            const validSaunaSelection = saunaOptions.some((slot: any) => `${slot.start_time} - ${slot.end_time}` === pkgSaunaSlot);
            setPkgSaunaSlot(saunaOptions.length > 0
              ? (validSaunaSelection ? pkgSaunaSlot : `${saunaOptions[0].start_time} - ${saunaOptions[0].end_time}`)
              : null);
            const saltSlotsForPackage = pData.saltroom?.is_closed
              ? []
              : (pData.saltroom?.slots || []).filter((slot: any) => !slot.is_fully_booked && (slot.remaining_capacity ?? 0) >= guestsCount);
            const validSaltSelection = saltSlotsForPackage.some((slot: any) => `${slot.start_time} - ${slot.end_time}` === pkgSaltRoomSlot);
            setPkgSaltRoomSlot(saltSlotsForPackage.length > 0
              ? (validSaltSelection ? pkgSaltRoomSlot : `${saltSlotsForPackage[0].start_time} - ${saltSlotsForPackage[0].end_time}`)
              : null);
            const activityList: any[] = Array.isArray(pData.activities) ? pData.activities : pData.activities?.activities || [];
            const availableActivity = pData.activities?.is_closed ? undefined : activityList.find((activity: any) => activity.available_slots > 0);
            const selectedActivityAvailable = !pData.activities?.is_closed && activityList.some((activity: any) => activity.id === pkgSelectedActivityId && activity.available_slots > 0);
            setPkgSelectedActivityId(selectedActivityAvailable ? pkgSelectedActivityId : (availableActivity?.id || null));
            const lunchTimes = pData.lunchroom?.open_time && pData.lunchroom?.close_time
              ? (() => {
                  const [startH, startM] = pData.lunchroom.open_time.split(":").map(Number);
                  const [endH, endM] = pData.lunchroom.close_time.split(":").map(Number);
                  const startMinutes = startH * 60 + (startM || 0);
                  const endMinutes = endH * 60 + (endM || 0);
                  return Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && startMinutes < endMinutes
                    ? Array.from({ length: Math.floor((endMinutes - startMinutes) / 60) + 1 }, (_, index) => {
                        const minutes = startMinutes + index * 60;
                        return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
                      })
                    : [];
                })()
              : [];
            setPkgLunchTime(pData.lunchroom?.is_closed ? "" : (lunchTimes.includes(pkgLunchTime) ? pkgLunchTime : (lunchTimes[0] || "")));
          }
          return;
        }

        const queryType = isSaltRoom ? "saltroom" : serviceType;
        const res = await appFetch(`${API_BASE_URL}/services/slots/?type=${queryType}&date=${date}`);
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
              // 1. VIP Sauna slots
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

              // 2. Sauna slots
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
        if (isPackage && isMounted) {
          console.log("[DEV LOG - PACKAGE SLOTS NETWORK ERROR]", err);
          setPackageSlotsData(null);
          setPackageRequestError(mapPackageRequestError(0, {}));
          return;
        }
        console.warn("Failed to fetch slots from API, using fallbacks:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSlots();

    return () => {
      isMounted = false;
    };
  }, [serviceType, isSaltRoom, isPackage, date, durationHours, isSharedSauna, guestsCount, packageId, packageHasBookableServices, retryPackageRequest]);

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
      const actList: any[] = Array.isArray(packageSlotsData?.activities)
        ? packageSlotsData.activities
        : packageSlotsData?.activities?.activities || [];
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
          subtitle={""}
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
                    ? "Sauna"
                    : `VIP Sauna (${durationHours}h)`
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
                Salt Room Session (1 Hour)
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
                VIP Sauna ({durationHours} Hours Session)
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
                Sauna (1.5 Hours Session)
              </Text>
            </View>
          </View>
        )}

        {/* Error / Blocked / Closed banners */}
        {isBlocked && (
          <View style={styles.alertCardBlocked}>
            <AlertTriangle size={22} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitleBlocked}>{t("bookingFlow.time.dateBlockedTitle", { defaultValue: "Date Blocked" })}</Text>
              <Text style={styles.alertDescBlocked}>
                {isPackage
                  ? t("bookingFlow.arrangementFlow.packageDateBlocked")
                  : t("bookingFlow.time.dateBlockedMsg", { defaultValue: "This date has been marked as unavailable by administration. Please select another date." })}
              </Text>
            </View>
          </View>
        )}

        {isClosed && (
          <View style={styles.alertCardClosed}>
            <Info size={22} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitleClosed}>{t("bookingFlow.time.serviceClosedTitle", { defaultValue: "Service Closed on This Date" })}</Text>
              <Text style={styles.alertDescClosed}>{isPackage
                ? t("bookingFlow.arrangementFlow.packageClosed")
                : closedInfo}</Text>
            </View>
          </View>
        )}

        {isPackage && !loading && packageRequestError && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{packageRequestError}</Text>
            <Pressable
              onPress={() => setRetryPackageRequest((attempt) => attempt + 1)}
              style={{ alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: brownGold }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("bookingFlow.arrangementFlow.retry")}</Text>
            </Pressable>
          </Card>
        )}

        {isPackage && !loading && !isBlocked && !isClosed && !packageRequestError && (!packageHasBookableServices || packageHasNoBookableResponse) && (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t("bookingFlow.arrangementFlow.noBookableServices")}</Text>
          </Card>
        )}

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={{ marginTop: 12, color: textMuted }}>{isPackage
              ? t("bookingFlow.arrangementFlow.loadingSlots")
              : t("bookingFlow.time.checkingSlots", { defaultValue: "Checking live available slots..." })}</Text>
          </View>
        ) : !isBlocked && !isClosed && !packageRequestError && (!isPackage || (packageHasBookableServices && !packageHasNoBookableResponse)) ? (
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
                          </View>

                          <View style={{ alignItems: "flex-end", gap: 4 }}>
                            {isFullyBooked ? (
                              <View style={styles.badgeSoldOut}>
                                <Text style={styles.badgeSoldOutText}>{t("bookingFlow.time.fullyBooked", { defaultValue: "Fully Booked" })}</Text>
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
                {packageIncludesSauna && !packageSlotsData?.sauna && (
                  <Card style={styles.packageSubServiceCard}>
                    <Text style={styles.subServiceClosedText}>{t("bookingFlow.arrangementFlow.noSaunaSlots")}</Text>
                  </Card>
                )}
                {packageIncludesSauna && packageSlotsData?.sauna && (
                  <Card style={styles.packageSubServiceCard}>
                    <View style={styles.subServiceHeader}>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>1</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subServiceTitle}>
                          {t("bookingFlow.arrangementFlow.choosePreferredTimeFor", { serviceName: saunaApiServiceName })}
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          {pkgSaunaType === "shared" ? "Shared sauna • 90 mins" : "Private sanctuary session"}
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData.sauna.private_sauna && packageSlotsData.sauna.shared_sauna && (
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                        {(["private", "shared"] as const).map((type) => (
                          <Pressable
                            key={type}
                            onPress={() => { setPkgSaunaType(type); setPkgSaunaSlot(null); }}
                            style={[styles.lunchPill, pkgSaunaType === type && styles.lunchPillActive]}
                          >
                            <Text style={[styles.lunchPillText, pkgSaunaType === type && styles.lunchPillTextActive]}>
                              {type === "private"
                                ? t("bookingFlow.arrangementFlow.privateSauna")
                                : t("bookingFlow.arrangementFlow.sharedSauna")}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    {packageSlotsData.sauna.is_closed ? (
                      <View style={styles.subServiceClosedBox}>
                        <Info size={16} color="#D97706" />
                        <Text style={styles.subServiceClosedText}>{t("bookingFlow.arrangementFlow.saunaClosed")}</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {/* Private sauna slots */}
                        {(() => {
                          const allSlots = packageSaunaSlots;

                          if (packageSaunaAvailableSlots.length === 0) {
                            return (
                              <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic" }}>
                                {t("bookingFlow.arrangementFlow.noSaunaSlots")}
                              </Text>
                            );
                          }

                          return packageSaunaAvailableSlots.map((slot: any, idx: number) => {
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
                          {t("bookingFlow.arrangementFlow.choosePreferredTimeFor", { serviceName: lunchroomApiServiceName })}
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          {packageSlotsData?.lunchroom?.open_time && packageSlotsData?.lunchroom?.close_time
                            ? `Operating hours: ${packageSlotsData.lunchroom.open_time} - ${packageSlotsData.lunchroom.close_time}`
                            : t("bookingFlow.arrangementFlow.lunchroomHoursUnavailable")}
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData?.lunchroom?.is_closed ? (
                      <View style={styles.subServiceClosedBox}>
                        <Info size={16} color="#D97706" />
                        <Text style={styles.subServiceClosedText}>{t("bookingFlow.arrangementFlow.lunchroomClosed")}</Text>
                      </View>
                    ) : !packageSlotsData?.lunchroom?.open_time || !packageSlotsData?.lunchroom?.close_time ? (
                      <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginTop: 8 }}>
                        {t("bookingFlow.arrangementFlow.lunchroomHoursUnavailable")}
                      </Text>
                    ) : dynamicLunchSlots.length === 0 ? (
                          <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginTop: 8 }}>
                            {t("bookingFlow.arrangementFlow.lunchroomNoTimes")}
                          </Text>
                        ) : <View style={{ marginTop: 12, gap: 10 }}>
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
                              <Text style={styles.lunchDropdownLabel}>{t("bookingFlow.time.selectedArrivalTime", { defaultValue: "Selected Arrival Time" })}</Text>
                              <Text style={styles.lunchDropdownValue}>
                                {pkgLunchTime ? `${pkgLunchTime} Arrival` : "Select Arrival Time"}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.lunchDropdownChangeText}>
                              {t("bookingFlow.general.change", { defaultValue: "Change" })}
                            </Text>
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
                    }
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
                          {t("bookingFlow.arrangementFlow.choosePreferredTimeFor", { serviceName: saltRoomApiServiceName })}
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          45-minute aerosol halotherapy session
                        </Text>
                      </View>
                    </View>

                    {packageSlotsData?.saltroom?.is_closed ? (
                      <View style={styles.subServiceClosedBox}>
                        <Info size={16} color="#D97706" />
                        <Text style={styles.subServiceClosedText}>{t("bookingFlow.arrangementFlow.saltRoomClosed")}</Text>
                      </View>
                    ) : packageSlotsData?.saltroom?.slots && Array.isArray(packageSlotsData.saltroom.slots) && packageSlotsData.saltroom.slots.some((slot: any) => !slot.is_fully_booked && (slot.remaining_capacity ?? 0) >= guestsCount) ? (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {packageSlotsData.saltroom.slots.filter((slot: any) => !slot.is_fully_booked && (slot.remaining_capacity ?? 0) >= guestsCount).map((slot: any, idx: number) => {
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
                        {t("bookingFlow.arrangementFlow.saltRoomNoSessions")}
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
                          {t("bookingFlow.arrangementFlow.choosePreferredTimeFor", { serviceName: activityApiServiceName })}
                        </Text>
                        <Text style={styles.subServiceDesc}>
                          Scheduled wellness studio activity
                        </Text>
                      </View>
                    </View>

                    {packageActivitiesClosed ? (
                      <View style={styles.subServiceClosedBox}>
                        <Info size={16} color="#D97706" />
                        <Text style={styles.subServiceClosedText}>{t("bookingFlow.arrangementFlow.activityClosed")}</Text>
                      </View>
                    ) : packageActivitiesList.length > 0 ? (
                      <View style={{ gap: 8, marginTop: 10 }}>
                        {packageActivitiesList.map((act: any) => {
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
                        {t("bookingFlow.arrangementFlow.activityNoSessions")}
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
                  <Text style={styles.modalTitle}>{t("bookingFlow.time.selectLunchroomArrival", { defaultValue: "Select Lunchroom Arrival" })}</Text>
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
            loading ||
            Boolean(packageRequestError) ||
            (isPackage
              ? (!packageHasBookableServices || packageHasNoBookableResponse || (packageIncludesSauna && !packageSlotsData?.sauna?.is_closed && packageSaunaAvailableSlots.length > 0 && !pkgSaunaSlot))
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
