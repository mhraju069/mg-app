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
import { CATEGORY_DATA } from "@/utils/constants";
import { useBookingStore } from "@/utils/bookingStore";
import { useLocalSearchParams, router } from "expo-router";
import {
  Star,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Check,
  CheckCircle2,
  Info,
  Calendar as CalendarIcon,
  Boxes,
  Infinity,
  CreditCard,
  AlertCircle,
} from "lucide-react-native";
import React, { useEffect, useState, useMemo } from "react";
import { Image, Pressable, StyleSheet, ActivityIndicator, Platform, TextInput, Modal, TouchableOpacity } from "react-native";
import { Calendar } from "react-native-calendars";

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const cleanCategory = (category || "sauna").toLowerCase().trim();
  const fallbackData = CATEGORY_DATA[cleanCategory] || CATEGORY_DATA.sauna;

  // General Category State
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedService, setSelectedService] = useState<any | null>(null);

  // Dedicated Sauna Configurator State
  const isSaunaCategory = cleanCategory === "sauna";
  const [saunaType, setSaunaType] = useState<"private" | "shared">("private");
  const [durationHours, setDurationHours] = useState<3 | 4>(3);
  const [saunaGuestsCount, setSaunaGuestsCount] = useState<number>(2);
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [saunaApiData, setSaunaApiData] = useState<any | null>(null);

  // Dedicated Salt Room Configurator State (matching Web arrangements/saltroom flow)
  const isSaltRoomCategory = cleanCategory === "saltroom" || cleanCategory === "salt_room" || cleanCategory === "arrangements";
  const [saltApiData, setSaltApiData] = useState<any | null>(null);
  const [selectedSaltDate, setSelectedSaltDate] = useState<string>("");
  const [showSaltDatePicker, setShowSaltDatePicker] = useState<boolean>(false);
  const [selectedSaltOption, setSelectedSaltOption] = useState<"single" | "10_session_pass" | "once_a_week" | "unlimited">("single");
  const [saltGuestsCount, setSaltGuestsCount] = useState<number>(1);
  const [loadingSaltSlots, setLoadingSaltSlots] = useState<boolean>(false);
  const [isSaltDateBlocked, setIsSaltDateBlocked] = useState<boolean>(false);
  const [saltDateBlockedMsg, setSaltDateBlockedMsg] = useState<string | null>(null);
  const [slotDateMembership, setSlotDateMembership] = useState<any | null>(null);

  const primary = useColor("primary");
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const darkBrown = "#1d1a17";
  const { t } = useTranslation();

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchCategoryDetails = async () => {
      try {
        const endpointType = cleanCategory === "arrangements" ? "saltroom" : cleanCategory;
        const res = await fetch(`http://localhost/api/services/details/${endpointType}/`);
        if (res.ok) {
          const resJson = await res.json();
          const apiData = resJson?.data;

          if (isMounted && apiData) {
            if (isSaunaCategory) {
              setSaunaApiData(apiData);
              return;
            }

            if (isSaltRoomCategory) {
              setSaltApiData(apiData);
              return;
            }

            let mappedItems: any[] = [];
            if (cleanCategory === "activity" || cleanCategory === "activities") {
              const acts = Array.isArray(apiData) ? apiData : apiData.activities || [];
              mappedItems = acts.map((act: any) => {
                const availableSlots = typeof act.available_slots === "number" ? act.available_slots : (act.capacity ? Math.max(0, act.capacity - (act.booked_slots || 0)) : 10);
                const isSoldOut = availableSlots <= 0 || act.is_available === false;
                const featuresList = (act.features || []).map((f: any) => typeof f === "string" ? f : (f.feature || f.feature_en || "")).filter(Boolean);

                return {
                  id: act.id,
                  title: act.title || "Yoga & Movement Session",
                  subtitle: act.subtitle || (act.host ? `Host: ${act.host}` : "Guided movement in our serenity studio"),
                  description: act.description || "Find your center with guided movement.",
                  price: parseFloat(String(act.price || 15)),
                  capacity: `Max ${act.capacity || 10}`,
                  rawCapacity: act.capacity || 10,
                  availableSlots: availableSlots,
                  bookedSlots: act.booked_slots || 0,
                  isSoldOut: isSoldOut,
                  host: act.host,
                  features: featuresList,
                  date: act.date,
                  openTime: act.open_time,
                  closeTime: act.close_time,
                  duration: act.open_time && act.close_time ? `${act.open_time.slice(0, 5)} - ${act.close_time.slice(0, 5)}` : "60 mins",
                  requirement: act.date ? `${act.date}` : "Scheduled class",
                  rating: 4.9,
                  image: act.images || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2070&auto=format&fit=crop",
                };
              });
            } else if (cleanCategory === "package" || cleanCategory === "packages") {
              const pkgs = Array.isArray(apiData) ? apiData : apiData.packages || [];
              mappedItems = pkgs.map((pkg: any) => ({
                id: pkg.id,
                title: pkg.title || "Curated Wellness Journey",
                subtitle: "Full-day curated combination",
                description: pkg.description || "Comprehensive restorative experience.",
                price: parseFloat(String(pkg.price || 180)),
                capacity: "2-4 persons",
                duration: "Full-day experience",
                requirement: "Combined package",
                rating: 4.9,
                image: pkg.image || "http://localhost/media/services/WhatsApp_Image_2026-10-01_at_10.07.11_PM.jpeg",
              }));
            } else if (cleanCategory === "lunchroom") {
              const lRoom = Array.isArray(apiData) ? apiData[0] : apiData.lunchroom?.[0];
              mappedItems.push({
                id: "lunchroom-exp",
                title: lRoom?.title || "Lunchroom Table Reservation",
                subtitle: lRoom?.subtitle || "Nourishment for body and soul",
                description: lRoom?.description || "Seasonal, organic cuisine crafted for well-being.",
                price: 0,
                isFree: true,
                capacity: "1-6 people",
                duration: "120 minutes",
                requirement: "Payment at table",
                rating: 4.8,
                image: lRoom?.images || "http://localhost/media/services/pexels-alexy-almond-3758026.jpg",
              });
            }

            if (mappedItems.length > 0) {
              setServicesList(mappedItems);
              const firstAvailable = mappedItems.find((item: any) => !item.isSoldOut) || null;
              setSelectedService(firstAvailable);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch service detail, using local fallback:", err);
      }

      if (isMounted) {
        setServicesList(fallbackData.services || []);
        if (fallbackData.services?.length) {
          setSelectedService(fallbackData.services[0]);
        }
      }
    };

    fetchCategoryDetails().finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [cleanCategory, isSaunaCategory, isSaltRoomCategory]);

  // =========================================================================
  // SAUNA CONFIGURATOR CALCULATIONS
  // =========================================================================
  const privateItem = saunaApiData?.private_sauna?.[0];
  const sharedItem = saunaApiData?.shared_sauna?.[0];
  const price3Hrs = privateItem?.base_price_3hrs ? parseFloat(String(privateItem.base_price_3hrs)) : 90;
  const price4Hrs = privateItem?.base_price_4hrs ? parseFloat(String(privateItem.base_price_4hrs)) : 350;
  const extraPersonFee = privateItem?.extra_person_price ? parseFloat(String(privateItem.extra_person_price)) : 50;
  const sharedPricePerson = sharedItem?.price_per_person ? parseFloat(String(sharedItem.price_per_person)) : 30;

  const rawFeatures: any[] = privateItem?.features || [];
  const apiFeatures = rawFeatures.map((f: any, idx: number) => ({
    id: String(f.id ?? idx),
    name: f.feature || f.feature_en || `Feature ${idx + 1}`,
    price: f.price ? parseFloat(String(f.price)) : 0,
  }));

  const extraGuestsCount = Math.max(0, saunaGuestsCount - 2);
  const privateBasePrice = durationHours === 4 ? price4Hrs : price3Hrs;
  const extrasCost = selectedExtras.reduce((sum, ext) => sum + ext.price, 0);

  const saunaTotal =
    saunaType === "private"
      ? privateBasePrice + extraGuestsCount * extraPersonFee + extrasCost
      : parseFloat((saunaGuestsCount * sharedPricePerson).toFixed(2));

  const toggleExtra = (extra: { id: string; name: string; price: number }) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      }
      return [...prev, extra];
    });
  };

  // =========================================================================
  // SALT ROOM CONFIGURATOR CALCULATIONS (EXACT MATCH WITH WEB)
  // =========================================================================
  const saltroomInfo = saltApiData?.saltroom?.[0];
  const saltPricePerPerson = parseFloat(String(saltroomInfo?.price_per_person || 25)) || 25;
  const sessionPass = saltApiData?.session_pass?.[0];
  const weeklyPlan = saltApiData?.subscription_plans?.find((p: any) => p.plan_type === "weekly");
  const unlimitedPlan = saltApiData?.subscription_plans?.find((p: any) => p.plan_type === "unlimited");

  const dynamicMaxCapacity = saltroomInfo?.max_capacity || 2;
  const userMembership = slotDateMembership || saltApiData?.user_membership;

  const passObj = userMembership?.pass || userMembership?.session_pass;
  const weeklySubObj = userMembership?.weekly_subscription || (
    userMembership?.subscription?.plan_type?.toLowerCase() === "weekly" ? userMembership?.subscription : null
  );
  const unlimitedSubObj = userMembership?.unlimited_subscription || (
    userMembership?.subscription?.plan_type?.toLowerCase() === "unlimited" ? userMembership?.subscription : null
  );

  const isPassCovered = Boolean(
    (userMembership?.has_pass || userMembership?.has_active_pass || Boolean(passObj)) &&
    (passObj?.remaining_sessions ?? 0) > 0 &&
    passObj?.is_available_for_date !== false
  );
  const isWeeklySubscriptionCovered = Boolean(
    weeklySubObj &&
    ((weeklySubObj.remaining_sessions ?? 0) > 0 || weeklySubObj.is_unlimited) &&
    weeklySubObj?.is_available_for_date !== false
  );
  const isUnlimitedSubscriptionCovered = Boolean(
    unlimitedSubObj && unlimitedSubObj?.is_available_for_date !== false
  );

  // Check if option is covered by user's pass/membership (single is ALWAYS €25, never free)
  const isSelectedSaltOptionCovered = useMemo(() => {
    if (selectedSaltOption === "single") return false;
    if (selectedSaltOption === "10_session_pass") return isPassCovered;
    if (selectedSaltOption === "once_a_week") return isWeeklySubscriptionCovered;
    if (selectedSaltOption === "unlimited") return isUnlimitedSubscriptionCovered;
    return false;
  }, [selectedSaltOption, isPassCovered, isWeeklySubscriptionCovered, isUnlimitedSubscriptionCovered]);

  const calculateSaltTotal = (): number => {
    if (selectedSaltOption === "single") {
      return saltGuestsCount * saltPricePerPerson;
    }
    if (isSelectedSaltOptionCovered) {
      return 0;
    }
    if (selectedSaltOption === "10_session_pass") return parseFloat(String(sessionPass?.price || 200)) || 200;
    if (selectedSaltOption === "once_a_week") return parseFloat(String(weeklyPlan?.price || 70)) || 70;
    if (selectedSaltOption === "unlimited") return parseFloat(String(unlimitedPlan?.price || 100)) || 100;
    return 0;
  };

  const saltTotal = calculateSaltTotal();

  // Fetch slot details when salt date changes
  const handleSaltDateChange = async (newDate: string) => {
    setSelectedSaltDate(newDate);
    setIsSaltDateBlocked(false);
    setSaltDateBlockedMsg(null);

    if (!newDate) {
      setSlotDateMembership(null);
      return;
    }

    setLoadingSaltSlots(true);
    try {
      const res = await fetch(`http://localhost/api/services/slots/?type=saltroom&date=${newDate}`);
      if (res.ok) {
        const json = await res.json();
        if (json.is_blocked) {
          setIsSaltDateBlocked(true);
          setSaltDateBlockedMsg(json.message || "This date is currently blocked for reservations.");
        } else if (json.is_closed || json?.data?.is_closed) {
          setIsSaltDateBlocked(true);
          setSaltDateBlockedMsg(json?.data?.info || json.message || "Salt Room is closed on this date.");
        }

        const memberInfo = json?.data?.user_membership || json?.user_membership;
        if (memberInfo) {
          setSlotDateMembership(memberInfo);
        }
      }
    } catch (err) {
      console.warn("Error checking salt slots:", err);
    } finally {
      setLoadingSaltSlots(false);
    }
  };

  // Build 4 salt options array (matching Web arrangements)
  const saltOptionsList = useMemo(() => {
    const list = [
      {
        id: "single" as const,
        title: saltroomInfo?.title || "Salt Room",
        badge: "Standard Booking",
        price: `€${saltPricePerPerson.toFixed(0)} / person`,
        subtitle: saltroomInfo?.subtitle || "Aerosol Halotherapy Session",
        icon: <Sparkles size={20} color={brownGold} />,
        features: [
          "1-hour pure aerosol halotherapy session",
          `Maximum ${dynamicMaxCapacity} people per session`,
          "Respiratory & skin restoration",
        ],
        isCovered: false,
      },
      {
        id: "10_session_pass" as const,
        title: sessionPass?.name || "10 Session pass",
        badge: "Best Value Pass",
        price: `€${parseFloat(String(sessionPass?.price || 200)).toFixed(0)}`,
        subtitle: "10 Sessions (€20 per session)",
        icon: <Boxes size={20} color={brownGold} />,
        features: [
          "10-session salt pass (€20 per session)",
          "Linked directly to customer account",
          "Valid for 1 full year after purchase",
        ],
        isCovered: Boolean(selectedSaltDate && isPassCovered),
      },
      {
        id: "once_a_week" as const,
        title: weeklyPlan?.name || "Once a Week",
        badge: "Weekly Ritual",
        price: `€${parseFloat(String(weeklyPlan?.price || 70)).toFixed(0)} / 4 weeks`,
        subtitle: "1 Session Every Week",
        icon: <CalendarIcon size={20} color={brownGold} />,
        features: [
          "1 Salt Room session per week included",
          "Maximum 4 included sessions per 4-week period",
          "Automated door access",
        ],
        isCovered: Boolean(selectedSaltDate && isWeeklySubscriptionCovered),
      },
      {
        id: "unlimited" as const,
        title: unlimitedPlan?.name || "Unlimited",
        badge: "Ultimate Wellness",
        price: `€${parseFloat(String(unlimitedPlan?.price || 100)).toFixed(0)} / 4 weeks`,
        subtitle: "Unlimited Halotherapy Access",
        icon: <Infinity size={20} color={brownGold} />,
        features: [
          "Unlimited use within available capacity",
          "1-hour Salt Room halotherapy access",
          "No session limits",
        ],
        isCovered: Boolean(selectedSaltDate && isUnlimitedSubscriptionCovered),
      },
    ];
    return list;
  }, [saltroomInfo, sessionPass, weeklyPlan, unlimitedPlan, saltPricePerPerson, dynamicMaxCapacity, selectedSaltDate, isPassCovered, isWeeklySubscriptionCovered, isUnlimitedSubscriptionCovered]);

  const handleContinue = () => {
    // 1. Sauna Continue Flow
    if (isSaunaCategory) {
      useBookingStore.setState({
        serviceId: saunaType === "private" ? "private-sauna" : "shared-sauna",
        serviceType: "sauna",
        serviceTitle:
          saunaType === "private"
            ? `Private Sauna (${durationHours} Hours)`
            : "Shared Sauna Experience",
        serviceSubtitle:
          saunaType === "private"
            ? "Exclusive sanctuary for ultimate privacy & relaxation"
            : "Communal tranquility & heat wellness",
        serviceImage:
          saunaType === "private"
            ? "http://localhost/media/services/private-sauna-v2.png"
            : "https://images.unsplash.com/photo-1544161515-436cefd54cbf?q=80&w=2070&auto=format&fit=crop",
        price: saunaTotal,
        isFree: false,
        saunaType,
        isSharedSauna: saunaType === "shared",
        durationHours: saunaType === "private" ? durationHours : 1.5,
        guestsCount: saunaGuestsCount,
        basePrice: privateBasePrice,
        extraPersonFee,
        selectedExtras,
      });

      router.push({
        pathname: "/(bookings)/select-date",
        params: {
          serviceId: saunaType === "private" ? "private-sauna" : "shared-sauna",
          category: "sauna",
          saunaType,
          durationHours: String(durationHours),
          guestsCount: String(saunaGuestsCount),
          price: String(saunaTotal),
        },
      });
      return;
    }

    // 2. Salt Room Continue Flow (With 4 passes & date locked)
    if (isSaltRoomCategory) {
      if (!selectedSaltDate || isSaltDateBlocked) return;

      const chosenOpt = saltOptionsList.find((o) => o.id === selectedSaltOption);
      useBookingStore.setState({
        serviceId: "salt-room",
        serviceType: "saltroom",
        isSaltRoom: true,
        passType: selectedSaltOption,
        serviceTitle: chosenOpt?.title || "Salt Room",
        serviceSubtitle: chosenOpt?.subtitle || "Halotherapy Session",
        serviceImage: "http://localhost/media/services/saltroom-v2.png",
        price: saltTotal,
        isFree: isSelectedSaltOptionCovered,
        isPassCovered: isSelectedSaltOptionCovered,
        date: selectedSaltDate,
        guestsCount: saltGuestsCount,
        planId: selectedSaltOption === "once_a_week" ? weeklyPlan?.id : selectedSaltOption === "unlimited" ? unlimitedPlan?.id : undefined,
        passId: selectedSaltOption === "10_session_pass" ? sessionPass?.id : undefined,
        paymentMode: isSelectedSaltOptionCovered ? (selectedSaltOption === "10_session_pass" ? "pass" : "subscription") : "card",
      });

      // Jump directly to choose time since date was already selected in step 1
      router.push({
        pathname: "/(bookings)/select-time",
        params: {
          date: selectedSaltDate,
        },
      });
      return;
    }

    // 3. Activity Continue Flow (Matches Web Activities -> Information Flow)
    if (cleanCategory === "activity" || cleanCategory === "activities") {
      if (!selectedService || selectedService.isSoldOut) return;

      useBookingStore.setState({
        serviceId: selectedService.id,
        serviceType: "activity",
        isActivity: true,
        serviceTitle: selectedService.title,
        serviceSubtitle: selectedService.subtitle || "",
        serviceImage: selectedService.image || "",
        price: selectedService.price || 15,
        isFree: false,
        date: selectedService.date || new Date().toISOString().split("T")[0],
        timeSlot: `${selectedService.openTime?.slice(0, 5) || "09:00"} - ${selectedService.closeTime?.slice(0, 5) || "10:30"}`,
        guestsCount: 1,
        activityDetails: {
          id: selectedService.id,
          name: selectedService.title,
          category: selectedService.category || "Yoga",
          description: selectedService.description,
          date: selectedService.date,
          startTime: selectedService.openTime?.slice(0, 5) || "09:00",
          endTime: selectedService.closeTime?.slice(0, 5) || "10:30",
          price: selectedService.price || 15,
          maxParticipants: selectedService.rawCapacity || 10,
          bookedParticipants: selectedService.bookedSlots || 0,
          availableSlots: selectedService.availableSlots,
          bookedSlots: selectedService.bookedSlots,
          teacherHost: selectedService.host,
          features: selectedService.features,
        },
      });

      router.push("/(bookings)/information");
      return;
    }

    // 4. Other services continue flow (Packages, Lunchroom)
    if (!selectedService) return;

    useBookingStore.setState({
      serviceId: selectedService.id,
      serviceType: cleanCategory,
      serviceTitle: selectedService.title,
      serviceSubtitle: selectedService.subtitle || "",
      serviceImage: selectedService.image || "",
      price: selectedService.price || 0,
      isFree: selectedService.isFree || false,
      guestsCount: 2,
    });

    if (cleanCategory === "lunchroom") {
      router.push("/(bookings)/information");
    } else {
      router.push({
        pathname: "/(bookings)/select-date",
        params: {
          serviceId: selectedService.id,
          category: cleanCategory,
          serviceTitle: selectedService.title,
          price: selectedService.price,
        },
      });
    }
  };

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={
            isSaunaCategory
              ? "Sauna & Wellness"
              : isSaltRoomCategory
              ? "Salt Room Halotherapy"
              : t(`home.categories.${cleanCategory}.title`) || `${cleanCategory.toUpperCase()} Experiences`
          }
          subtitle={
            isSaunaCategory
              ? "Exclusive private sanctuary or peaceful shared wellness experience."
              : isSaltRoomCategory
              ? "Pure aerosol micro-climate. Select your reservation date first, then choose your session or pass."
              : t(`home.categories.${cleanCategory}.subtitle`) || "A carefully curated moment, designed around you."
          }
        />

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={brownGold} />
            <Text style={{ marginTop: 12, color: textMuted }}>Loading experience details...</Text>
          </View>
        ) : isSaltRoomCategory ? (
          /* ========================================================================= */
          /* DEDICATED SALT ROOM CONFIGURATOR (MATCHES WEB ARRANGEMENTS EXACTLY)       */
          /* ========================================================================= */
          <View style={{ gap: 20 }}>
            {/* Overview parameter banner */}
            <Card style={styles.bannerCard}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={styles.overviewBadgeBox}>
                  <Text style={styles.overviewBadgeLabel}>Max Capacity</Text>
                  <Text style={styles.overviewBadgeValue}>Max {dynamicMaxCapacity} Guests</Text>
                </View>
                <View style={styles.overviewBadgeBox}>
                  <Text style={styles.overviewBadgeLabel}>Session Length</Text>
                  <Text style={styles.overviewBadgeValue}>1 Hour</Text>
                </View>
                <View style={styles.overviewBadgeBox}>
                  <Text style={styles.overviewBadgeLabel}>Single Price</Text>
                  <Text style={[styles.overviewBadgeValue, { color: brownGold }]}>€{saltPricePerPerson}/Person</Text>
                </View>
              </View>
            </Card>

            {/* STEP 1: Select Reservation Date First */}
            <Card style={styles.sectionCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sectionTitle}>1. Select Reservation Date</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: brownGold }}>
                  Operating: 09:00 – 21:00
                </Text>
              </View>

              <View style={{ gap: 8, marginTop: 4 }}>
                <Pressable
                  style={[
                    styles.datePickerTrigger,
                    selectedSaltDate && styles.datePickerTriggerFilled,
                    isSaltDateBlocked && styles.datePickerTriggerBlocked,
                  ]}
                  onPress={() => setShowSaltDatePicker(true)}
                >
                  <View style={styles.datePickerButtonInner}>
                    <CalendarIcon size={20} color={selectedSaltDate ? "#fff" : "#9B7C56"} />
                    <Text
                      style={[
                        styles.datePickerButtonText,
                        selectedSaltDate && styles.datePickerButtonTextFilled,
                      ]}
                    >
                      {selectedSaltDate ? `Selected: ${selectedSaltDate}` : "Select Date"}
                    </Text>
                  </View>
                </Pressable>

                {/* Calendar Modal */}
                <Modal
                  visible={showSaltDatePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowSaltDatePicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <View style={styles.modalHeader}>
                        <View>
                          <Text style={styles.modalTitle}>Select Salt Room Date</Text>
                          <Text style={styles.modalSub}>Past dates are disabled. Operating: 09:00 - 21:00</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.modalCloseBtn}
                          onPress={() => setShowSaltDatePicker(false)}
                        >
                          <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "700" }}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      <Calendar
                        minDate={todayStr}
                        enableSwipeMonths
                        hideExtraDays
                        current={selectedSaltDate || todayStr}
                        markedDates={{
                          ...(selectedSaltDate ? {
                            [selectedSaltDate]: {
                              selected: true,
                              selectedColor: brownGold,
                              selectedTextColor: "#fff",
                            }
                          } : {})
                        }}
                        onDayPress={(day) => {
                          if (day.dateString >= todayStr) {
                            handleSaltDateChange(day.dateString);
                            setShowSaltDatePicker(false);
                          }
                        }}
                        theme={{
                          calendarBackground: "#FAF8F5",
                          todayTextColor: brownGold,
                          arrowColor: brownGold,
                          selectedDayBackgroundColor: brownGold,
                          selectedDayTextColor: "#ffffff",
                          textDayFontFamily: Fonts.serif,
                          textMonthFontFamily: Fonts.serif,
                          textDayHeaderFontFamily: Fonts.serif,
                          textDayFontSize: 15,
                          textMonthFontSize: 17,
                          textDayHeaderFontSize: 13,
                        }}
                        style={{
                          borderRadius: 16,
                          overflow: "hidden",
                          borderWidth: 1,
                          borderColor: "#EBE3DA",
                        }}
                      />

                      <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "flex-end" }}>
                        <Button
                          variant="ghost"
                          onPress={() => setShowSaltDatePicker(false)}
                          style={{ paddingHorizontal: 16, height: 40 }}
                        >
                          <Text style={{ color: "#64748B", fontWeight: "600" }}>Close</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                </Modal>

                {loadingSaltSlots && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <ActivityIndicator size="small" color={brownGold} />
                    <Text style={{ fontSize: 11, color: brownGold }}>Checking date slots & membership...</Text>
                  </View>
                )}

                {isSaltDateBlocked && (
                  <View style={styles.blockedAlertBox}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.blockedAlertText}>{saltDateBlockedMsg}</Text>
                  </View>
                )}

                {!selectedSaltDate ? (
                  <View style={styles.hintNoticeBox}>
                    <Info size={15} color="#D97706" />
                    <Text style={styles.hintNoticeText}>
                      Please select a reservation date above first to unlock booking cards & passes.
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 12, color: "#059669", fontWeight: "600", marginTop: 2 }}>
                    ✓ Date locked for session: {selectedSaltDate}
                  </Text>
                )}
              </View>
            </Card>

            {/* STEP 2: Select Booking Option or Membership (4 Cards) */}
            <View style={{ gap: 12 }}>
              <Text style={styles.sectionTitle}>
                2. Select Booking Option or Membership
              </Text>

              <View style={{ gap: 14 }}>
                {saltOptionsList.map((opt) => {
                  const isSelected = selectedSaltOption === opt.id;
                  const isCardDisabled = !selectedSaltDate || isSaltDateBlocked;

                  return (
                    <Pressable
                      key={opt.id}
                      disabled={isCardDisabled}
                      style={[
                        styles.saltOptionCard,
                        isSelected && !isCardDisabled && styles.saltOptionCardActive,
                        isCardDisabled && styles.saltOptionCardDisabled,
                      ]}
                      onPress={() => setSelectedSaltOption(opt.id)}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={styles.optionBadge}>
                          <Text style={styles.optionBadgeText}>{opt.badge}</Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          {opt.isCovered && (
                            <View style={styles.coveredBadge}>
                              <Text style={styles.coveredBadgeText}>Active Pass (Covered)</Text>
                            </View>
                          )}
                          <View
                            style={[
                              styles.radioIndicator,
                              isSelected && !isCardDisabled && styles.radioIndicatorActive,
                            ]}
                          >
                            {isSelected && !isCardDisabled && <CheckCircle2 size={16} color="#fff" />}
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
                        {opt.icon}
                        <Text style={styles.saltOptionTitle}>{opt.title}</Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6, marginVertical: 4 }}>
                        {opt.isCovered ? (
                          <>
                            <Text style={{ textDecorationLine: "line-through", color: "#94A3B8", fontSize: 16 }}>
                              {opt.price}
                            </Text>
                            <Text style={styles.saltOptionPrice}>€0</Text>
                          </>
                        ) : (
                          <Text style={styles.saltOptionPrice}>{opt.price}</Text>
                        )}
                      </View>

                      <Text style={styles.saltOptionSubtitle}>{opt.subtitle}</Text>

                      <View style={styles.featuresList}>
                        {opt.features.map((feat, fIdx) => (
                          <View key={fIdx} style={styles.featureRow}>
                            <Text style={{ color: brownGold, fontWeight: "800" }}>✓</Text>
                            <Text style={styles.featureItemText}>{feat}</Text>
                          </View>
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* STEP 3: Number of Guests (1 to dynamicMaxCapacity) */}
            <Card style={styles.sectionCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.sectionTitle}>
                  3. Number of Guests (Max {dynamicMaxCapacity})
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: brownGold }}>
                  Strict micro-climate capacity
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                {Array.from({ length: dynamicMaxCapacity }, (_, i) => i + 1).map((num) => {
                  const isSel = saltGuestsCount === num;
                  const isGuestDisabled = !selectedSaltDate || isSaltDateBlocked;

                  return (
                    <Pressable
                      key={num}
                      disabled={isGuestDisabled}
                      style={[
                        styles.guestOption,
                        isSel && !isGuestDisabled && styles.guestOptionActive,
                        isGuestDisabled && { opacity: 0.5 },
                      ]}
                      onPress={() => setSaltGuestsCount(num)}
                    >
                      <Text style={[styles.guestNumber, isSel && !isGuestDisabled && styles.guestNumberActive]}>
                        {num} {num === 1 ? "Person" : "People"}
                      </Text>
                      <Text style={[styles.guestSub, isSel && !isGuestDisabled && styles.guestSubActive]}>
                        {selectedSaltOption === "single"
                          ? `€${(num * saltPricePerPerson).toFixed(0)}`
                          : isSelectedSaltOptionCovered
                          ? "Covered (€0)"
                          : "Included in Pass"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* Total Price Section */}
            <Card style={styles.pricingSummaryCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.totalLabel}>Calculated Price</Text>
                  <Text style={styles.totalSub}>
                    {selectedSaltOption === "single"
                      ? `${saltroomInfo?.title || "Salt Room"} • ${saltGuestsCount} Guest(s)`
                      : saltOptionsList.find((o) => o.id === selectedSaltOption)?.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: isSelectedSaltOptionCovered ? "#059669" : "#64748B", marginTop: 2 }}>
                    {isSelectedSaltOptionCovered
                      ? "✓ Active pass detected — €0 due today."
                      : selectedSaltOption === "single"
                      ? `€${saltPricePerPerson.toFixed(0)} × ${saltGuestsCount} guest(s)`
                      : "Standard pass fee applies."}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>€{saltTotal.toFixed(0)}</Text>
              </View>
            </Card>
          </View>
        ) : isSaunaCategory ? (
          /* ========================================================================= */
          /* DEDICATED SAUNA CONFIGURATOR (MATCHES WEB VERSION EXACTLY)               */
          /* ========================================================================= */
          <View style={{ gap: 20 }}>
            {/* 1. Toggle: Private Sauna vs Shared Sauna */}
            <View style={styles.toggleContainer}>
              <Pressable
                style={[
                  styles.toggleButton,
                  saunaType === "private" && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setSaunaType("private");
                  if (saunaGuestsCount < 2) setSaunaGuestsCount(2);
                }}
              >
                <Sparkles size={16} color={saunaType === "private" ? "#fff" : "#64748B"} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    saunaType === "private" && styles.toggleButtonTextActive,
                  ]}
                >
                  Private Sauna
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.toggleButton,
                  saunaType === "shared" && styles.toggleButtonActive,
                ]}
                onPress={() => {
                  setSaunaType("shared");
                  if (saunaGuestsCount > 6) setSaunaGuestsCount(6);
                }}
              >
                <Users size={16} color={saunaType === "shared" ? "#fff" : "#64748B"} />
                <Text
                  style={[
                    styles.toggleButtonText,
                    saunaType === "shared" && styles.toggleButtonTextActive,
                  ]}
                >
                  Shared Sauna
                </Text>
              </Pressable>
            </View>

            {/* Banner description */}
            <Card style={styles.bannerCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.bannerIconBox}>
                  {saunaType === "private" ? (
                    <Sparkles size={22} color="#fff" />
                  ) : (
                    <Users size={22} color="#fff" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerBadge}>
                    {saunaType === "private" ? "EXCLUSIVE RESERVATION" : "SHARED SESSION ACCESS"}
                  </Text>
                  <Text style={styles.bannerTitle}>
                    {saunaType === "private" ? "Private Sauna Sanctuary" : "Shared Sauna Experience"}
                  </Text>
                  <Text style={styles.bannerDesc}>
                    {saunaType === "private"
                      ? "Booked exclusively by your group (2 to 6 people). Includes sauna, heated pool, relaxation lounge & +30m auto cleaning buffer."
                      : "Different customers book the same 1.5h session. Max 6 people per session + 15m changeover buffer."}
                  </Text>
                </View>
              </View>
            </Card>

            {/* PRIVATE SAUNA CONFIGURATION */}
            {saunaType === "private" ? (
              <View style={{ gap: 20 }}>
                {/* Duration Selector */}
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>1. Select Session Duration</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {/* 3 Hours */}
                    <Pressable
                      style={[
                        styles.durationCard,
                        durationHours === 3 && styles.durationCardActive,
                      ]}
                      onPress={() => setDurationHours(3)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.durationBadge}>POPULAR CHOICE</Text>
                        <Text style={styles.durationTitle}>3 Hours</Text>
                        <Text style={styles.durationSub}>
                          Base (2 guests): €{price3Hrs}
                        </Text>
                        <Text style={styles.durationExtra}>+€{extraPersonFee}/extra person</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          durationHours === 3 && styles.radioCircleActive,
                        ]}
                      >
                        {durationHours === 3 && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                    </Pressable>

                    {/* 4 Hours */}
                    <Pressable
                      style={[
                        styles.durationCard,
                        durationHours === 4 && styles.durationCardActive,
                      ]}
                      onPress={() => setDurationHours(4)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.durationBadge}>EXTENDED RELAXATION</Text>
                        <Text style={styles.durationTitle}>4 Hours</Text>
                        <Text style={styles.durationSub}>
                          Base (2 guests): €{price4Hrs}
                        </Text>
                        <Text style={styles.durationExtra}>+€{extraPersonFee}/extra person</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          durationHours === 4 && styles.radioCircleActive,
                        ]}
                      >
                        {durationHours === 4 && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                    </Pressable>
                  </View>
                </Card>

                {/* Number of Guests (2 to 6) */}
                <Card style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={styles.sectionTitle}>2. Number of Guests (2–6)</Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: brownGold }}>
                      {saunaGuestsCount > 2 ? `2 Base + ${saunaGuestsCount - 2} Extra` : "2 Base Guests"}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {[2, 3, 4, 5, 6].map((num) => {
                      const isSel = saunaGuestsCount === num;
                      return (
                        <Pressable
                          key={num}
                          style={[
                            styles.guestOption,
                            isSel && styles.guestOptionActive,
                          ]}
                          onPress={() => setSaunaGuestsCount(num)}
                        >
                          <Text style={[styles.guestNumber, isSel && styles.guestNumberActive]}>
                            {num}
                          </Text>
                          <Text style={[styles.guestSub, isSel && styles.guestSubActive]}>
                            {num === 2 ? "Base" : `+€${(num - 2) * extraPersonFee}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>

                {/* Extras & Enhancements */}
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>3. Enhance Your Experience (Optional Extras)</Text>
                  {apiFeatures.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 4 }}>
                      {apiFeatures.map((extra) => {
                        const isSelected = selectedExtras.some((e) => e.id === extra.id);
                        return (
                          <Pressable
                            key={extra.id}
                            style={[
                              styles.extraRow,
                              isSelected && styles.extraRowActive,
                            ]}
                            onPress={() => toggleExtra(extra)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                              <View
                                style={[
                                  styles.checkbox,
                                  isSelected && styles.checkboxActive,
                                ]}
                              >
                                {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                              </View>
                              <Text style={styles.extraName}>{extra.name}</Text>
                            </View>
                            <Text style={styles.extraPrice}>
                              {extra.price > 0 ? `+€${extra.price}` : "Included"}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: textMuted, fontStyle: "italic" }}>
                      Standard wellness amenities included.
                    </Text>
                  )}
                </Card>
              </View>
            ) : (
              /* SHARED SAUNA CONFIGURATION */
              <View style={{ gap: 20 }}>
                {/* Session overview */}
                <Card style={styles.sectionCard}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={styles.overviewBadgeBox}>
                      <Text style={styles.overviewBadgeLabel}>Session Length</Text>
                      <Text style={styles.overviewBadgeValue}>1.5 Hours</Text>
                    </View>
                    <View style={styles.overviewBadgeBox}>
                      <Text style={styles.overviewBadgeLabel}>Price Per Person</Text>
                      <Text style={[styles.overviewBadgeValue, { color: brownGold }]}>€{sharedPricePerson}</Text>
                    </View>
                    <View style={styles.overviewBadgeBox}>
                      <Text style={styles.overviewBadgeLabel}>Changeover</Text>
                      <Text style={styles.overviewBadgeValue}>15 Mins</Text>
                    </View>
                  </View>
                </Card>

                {/* Number of Places (1 to 6) */}
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Number of Places / Guests (1–6)</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isSel = saunaGuestsCount === num;
                      return (
                        <Pressable
                          key={num}
                          style={[
                            styles.guestOption,
                            isSel && styles.guestOptionActive,
                          ]}
                          onPress={() => setSaunaGuestsCount(num)}
                        >
                          <Text style={[styles.guestNumber, isSel && styles.guestNumberActive]}>
                            {num}
                          </Text>
                          <Text style={[styles.guestSub, isSel && styles.guestSubActive]}>
                            {num === 1 ? "1 Person" : `${num} Places`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              </View>
            )}

            {/* Total Price Calculation Card */}
            <Card style={styles.pricingSummaryCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.totalLabel}>Total Calculated Price</Text>
                  <Text style={styles.totalSub}>
                    {saunaType === "private"
                      ? `${durationHours}h private session for ${saunaGuestsCount} guests`
                      : `${saunaGuestsCount} place(s) @ €${sharedPricePerson}`}
                  </Text>
                </View>
                <Text style={styles.totalAmount}>€{saunaTotal.toFixed(2)}</Text>
              </View>
            </Card>
          </View>
        ) : (
          /* ========================================================================= */
          /* STANDARD CATEGORY SERVICES LIST (PACKAGES, LUNCH, ACTIVITIES)             */
          /* ========================================================================= */
          <View style={styles.list}>
            {servicesList.map((service: any) => {
              const isSelected = selectedService?.id === service.id;
              const isActivity = cleanCategory === "activity" || cleanCategory === "activities";
              const isSoldOut = Boolean(service.isSoldOut);

              return (
                <Pressable
                  key={service.id}
                  disabled={isSoldOut}
                  onPress={() => !isSoldOut && setSelectedService(service)}
                >
                  <Card
                    style={[
                      styles.serviceCard,
                      isSelected && !isSoldOut && {
                        borderWidth: 2.5,
                        borderColor: brownGold,
                      },
                      isSoldOut && styles.serviceCardSoldOut,
                    ]}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: service.image }}
                        style={[styles.serviceImage, isSoldOut && { opacity: 0.6 }]}
                      />

                      {/* Web-identical SOLD OUT banner overlay */}
                      {isSoldOut ? (
                        <View style={styles.soldOutOverlay}>
                          <View style={styles.soldOutBadge}>
                            <Text style={styles.soldOutBadgeText}>SOLD OUT</Text>
                          </View>
                        </View>
                      ) : null}

                      {/* Rating Badge */}
                      <View style={styles.ratingBadge}>
                        <Star size={12} color="#EAB308" fill="#EAB308" />
                        <Text style={styles.ratingText}>{service.rating || 4.9}</Text>
                      </View>

                      {isSelected && !isSoldOut && (
                        <View style={styles.selectedBadge}>
                          <Check size={14} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </View>

                    <View style={styles.serviceInfo}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <Text style={[styles.serviceTitle, { flex: 1 }]}>{service.title}</Text>
                        {/* Radio selection circle */}
                        <View
                          style={[
                            styles.activityRadio,
                            isSelected && !isSoldOut && styles.activityRadioActive,
                            isSoldOut && { opacity: 0.4 },
                          ]}
                        >
                          {isSelected && !isSoldOut && <Check size={12} color="#fff" strokeWidth={3} />}
                        </View>
                      </View>

                      {service.subtitle ? (
                        <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                      ) : null}

                      <Text
                        style={[styles.serviceDescription, { color: textMuted }]}
                        numberOfLines={3}
                      >
                        {service.description}
                      </Text>

                      {/* Detail metadata: Date/Time, Capacity & Live Available Slots */}
                      <View style={styles.detailsGrid}>
                        {service.duration ? (
                          <View style={styles.detailItem}>
                            <Clock size={15} color={brownGold} />
                            <Text variant="caption" style={styles.detailText}>
                              {service.date ? `${service.date} • ` : ""}{service.duration}
                            </Text>
                          </View>
                        ) : null}

                        {service.capacity ? (
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                            <View style={styles.detailItem}>
                              <Users size={15} color={brownGold} />
                              <Text variant="caption" style={styles.detailText}>
                                {service.capacity}
                              </Text>
                            </View>

                            {/* Remaining / Available Slots Badge */}
                            {isActivity && (
                              <View
                                style={[
                                  styles.slotsBadge,
                                  isSoldOut ? styles.slotsBadgeSoldOut : styles.slotsBadgeAvailable,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.slotsBadgeText,
                                    isSoldOut ? styles.slotsBadgeTextSoldOut : styles.slotsBadgeTextAvailable,
                                  ]}
                                >
                                  {isSoldOut
                                    ? "0 Slots Available"
                                    : `${service.availableSlots} of ${service.rawCapacity} Slots Available`}
                                </Text>
                              </View>
                            )}
                          </View>
                        ) : null}

                        {service.host ? (
                          <View style={styles.detailItem}>
                            <ShieldCheck size={15} color={brownGold} />
                            <Text variant="caption" style={styles.detailText}>
                              Host: {service.host}
                            </Text>
                          </View>
                        ) : service.requirement ? (
                          <View style={styles.detailItem}>
                            <ShieldCheck size={15} color={brownGold} />
                            <Text variant="caption" style={styles.detailText}>
                              {service.requirement}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Features pills if available */}
                      {Array.isArray(service.features) && service.features.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {service.features.map((feat: string, fIdx: number) => (
                            <View key={fIdx} style={styles.activityFeaturePill}>
                              <Text style={{ fontSize: 11, color: brownGold, fontWeight: "700" }}>✓</Text>
                              <Text style={styles.activityFeaturePillText}>{feat}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.priceRow}>
                        <View>
                          <Text style={styles.price}>
                            {service.isFree || service.price === 0
                              ? "Free Reservation"
                              : `€${service.price.toFixed(0)}`}
                            <Text style={{ fontSize: 12, fontWeight: "500", color: "#64748B" }}>
                              {isActivity ? " / person" : ""}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button
          onPress={handleContinue}
          disabled={
            isSaltRoomCategory
              ? !selectedSaltDate || isSaltDateBlocked
              : !selectedService && !isSaunaCategory
          }
        >
          <Text>
            {isSaltRoomCategory
              ? !selectedSaltDate
                ? "Please Select a Date to Continue"
                : isSaltDateBlocked
                ? "Date Blocked — Select Another"
                : isSelectedSaltOptionCovered
                ? "Book with Membership / Pass (Free)"
                : `Continue to Choose Time (€${saltTotal.toFixed(0)})`
              : t("buttons.continue", { defaultValue: "Continue" })}
          </Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 20,
    paddingTop: 0,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 5,
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#9B7C56",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  toggleButtonTextActive: {
    color: "#fff",
  },
  bannerCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#9B7C56",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
    marginTop: 2,
  },
  bannerDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 16,
  },
  sectionCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d1a17",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  durationCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FDFBF8",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  durationCardActive: {
    backgroundColor: "#FCF2E9",
    borderColor: "#9B7C56",
  },
  durationBadge: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  durationSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3D2E24",
    marginTop: 2,
  },
  durationExtra: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  guestOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBE3DA",
    backgroundColor: "#FDFBF8",
    alignItems: "center",
    justifyContent: "center",
  },
  guestOptionActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  guestNumber: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  guestNumberActive: {
    color: "#fff",
  },
  guestSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  guestSubActive: {
    color: "rgba(255,255,255,0.9)",
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBE3DA",
    backgroundColor: "#FDFBF8",
  },
  extraRowActive: {
    backgroundColor: "#FCF2E9",
    borderColor: "#9B7C56",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  extraName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d1a17",
  },
  extraPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9B7C56",
  },
  overviewBadgeBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8F5F2",
    alignItems: "center",
  },
  overviewBadgeLabel: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 4,
  },
  overviewBadgeValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
  },
  pricingSummaryCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#FBF6F3",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9B7C56",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#9B7C56",
  },
  datePickerTrigger: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#9B7C56",
    backgroundColor: "#FAF6F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9B7C56",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerTriggerFilled: {
    borderColor: "#9B7C56",
    backgroundColor: "#9B7C56",
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  datePickerTriggerBlocked: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  datePickerButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  datePickerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9B7C56",
    letterSpacing: 0.3,
  },
  datePickerButtonTextFilled: {
    color: "#ffffff",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FAF8F5",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  modalSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDE7E1",
    justifyContent: "center",
    alignItems: "center",
  },
  blockedAlertBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  blockedAlertText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  hintNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  hintNoticeText: {
    color: "#B45309",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  saltOptionCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
  },
  saltOptionCardActive: {
    backgroundColor: "#FCF2E9",
    borderColor: "#9B7C56",
    shadowColor: "#9B7C56",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  saltOptionCardDisabled: {
    opacity: 0.55,
    backgroundColor: "#F8FAFC",
  },
  optionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(155, 124, 86, 0.1)",
  },
  optionBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9B7C56",
    letterSpacing: 0.5,
  },
  coveredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  coveredBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#15803D",
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
  saltOptionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  saltOptionPrice: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#9B7C56",
  },
  saltOptionSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
  },
  featuresList: {
    borderTopWidth: 1,
    borderTopColor: "rgba(235, 227, 218, 0.7)",
    paddingTop: 10,
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureItemText: {
    fontSize: 12,
    color: "#475569",
  },
  serviceCard: {
    padding: 0,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  imageContainer: {
    height: 180,
    position: "relative",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  selectedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#9B7C56",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  serviceInfo: {
    padding: 18,
    gap: 8,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  serviceSubtitle: {
    fontSize: 13,
    color: "#9B7C56",
    fontWeight: "600",
  },
  serviceDescription: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.subtitle,
  },
  detailsGrid: {
    gap: 6,
    marginTop: 6,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#6B5D54",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#F1EBE4",
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#3D2E24",
  },
  serviceCardSoldOut: {
    opacity: 0.75,
    backgroundColor: "#FBF9F6",
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  soldOutBadge: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  soldOutBadgeText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  activityRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  activityRadioActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#9B7C56",
  },
  slotsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotsBadgeAvailable: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  slotsBadgeSoldOut: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  slotsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  slotsBadgeTextAvailable: {
    color: "#059669",
  },
  slotsBadgeTextSoldOut: {
    color: "#DC2626",
  },
  activityFeaturePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F8F5F1",
    borderWidth: 1,
    borderColor: "#EFE8DF",
  },
  activityFeaturePillText: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
});
