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
import { getStripe } from "@/utils/stripe";
import { useStripePayment } from "@/hooks/useStripePayment";
import StripeElementsCheckout, { NativeCardDetails } from "@/components/booking/StripeElementsCheckout";
import CancellationPolicyCard from "@/components/booking/CancellationPolicyCard";
import { router } from "expo-router";
import { API_BASE_URL } from "@/utils/constants";
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
  AlertCircle,
} from "lucide-react-native";
import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  Pressable,
} from "react-native";
import { CardNumberElement } from "@stripe/react-stripe-js";

export default function ConfirmationScreen() {
  const textMuted = useColor("textMuted");
  const borderColor = useColor("border");
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const { t, i18n } = useTranslation();
  const { confirmMobilePayment } = useStripePayment();

  const storeState = useBookingStore.getState();

  const localizedServiceTitle = useMemo(() => {
    const raw = storeState.serviceTitle;
    if (!raw) return "";

    // 1. Direct translation key lookup
    if (i18n.exists(`bookingFlow.services.${raw}`)) {
      return t(`bookingFlow.services.${raw}`);
    }

    // Lunchroom reservation titles are stored in English in the booking flow.
    if (storeState.serviceType?.toLowerCase().includes("lunchroom") || raw.toLowerCase().includes("lunchroom")) {
      return t("bookingFlow.review.lunchroomTableReservation", { defaultValue: raw });
    }

    // 2. Salt room normalization
    if (raw.toLowerCase().includes("salt") || storeState.serviceType === "saltroom" || storeState.isSaltRoom) {
      if (raw.toLowerCase().includes("10 session")) {
        return t("bookingFlow.services.10 Session pass", { defaultValue: "10 Session Pass" });
      }
      if (raw.toLowerCase().includes("once a week")) {
        return t("bookingFlow.services.Once a Week", { defaultValue: "Once a Week" });
      }
      if (raw.toLowerCase().includes("unlimited")) {
        return t("bookingFlow.services.Unlimited", { defaultValue: "Unlimited" });
      }
      return t("bookingFlow.saltRoom.title", { defaultValue: "Salt Room" });
    }

    // 3. Sauna normalization
    if (storeState.serviceType === "sauna") {
      if (raw.toLowerCase().includes("vip")) {
        return t(`bookingFlow.services.VIP Sauna (${storeState.durationHours || 3} Hours)`, {
          defaultValue: `VIP Sauna (${storeState.durationHours || 3} Hours)`,
        });
      }
      return t("bookingFlow.services.Sauna Experience", { defaultValue: "Sauna Experience" });
    }

    return raw;
  }, [storeState.serviceTitle, storeState.serviceType, storeState.isSaltRoom, storeState.durationHours, t, i18n.language]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ideal">("card");
  const [selectedBank, setSelectedBank] = useState<string>("ing");

  // Card details state
  const [cardHolder, setCardHolder] = useState<string>(storeState.fullName || "");
  const [postalCode, setPostalCode] = useState<string>("");
  const [nativeCardDetails, setNativeCardDetails] = useState<NativeCardDetails>({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  // Reference to Stripe instance and elements from checkout component
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [elementsInstance, setElementsInstance] = useState<any>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");
  const [confirmedRemainingSessions, setConfirmedRemainingSessions] = useState<number | string | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);

  const priceVal = storeState.price || 0;
  const isFree = storeState.isFree || priceVal === 0;
  const isLunchroomReservation = storeState.serviceType?.toLowerCase().includes("lunchroom")
    || storeState.serviceTitle?.toLowerCase().includes("lunchroom");
  const isSaltRoomReservation = Boolean(storeState.isSaltRoom)
    || storeState.serviceType === "salt_room"
    || storeState.serviceType === "saltroom"
    || storeState.serviceTitle?.toLowerCase().includes("salt");

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
    setErrorMessage(null);

    if (!policyAccepted) {
      setErrorMessage(
        t("bookingFlow.checkout.fullPolicy.mustAcceptPolicyError", {
          defaultValue: "Please read and accept the Cancellation, Rescheduling & Refund Policy to proceed.",
        })
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Handle Free Reservations (e.g. Salt Room pass/subscription or Lunchroom)
      if (isFree) {
        let bookingTime = "12:00:00";
        if (storeState.timeSlot) {
          const match = storeState.timeSlot.match(/(\d{1,2}:\d{2})/);
          if (match) {
            bookingTime = match[1].length === 4 ? `0${match[1]}:00` : `${match[1]}:00`;
          }
        }

        // Salt Room Free Pass / Subscription Booking Branch
        if (storeState.serviceType === "saltroom" || storeState.serviceType === "salt_room" || storeState.isSaltRoom) {
          const passIdentifier = storeState.purchaseId || storeState.passId;
          const saltPaymentMode = storeState.paymentMode || (storeState.passType === "10_session_pass" ? "pass" : "subscription");

          const saltPayload: any = {
            name: cardHolder.trim() || storeState.fullName || "Guest",
            email: storeState.email || "guest@example.com",
            phone: storeState.phone || "+31612345678",
            date: storeState.date || new Date().toISOString().split("T")[0],
            start_time: bookingTime,
            capacity: 1,
            payment_mode: saltPaymentMode,
            ...(storeState.specialRequests ? { special_request: storeState.specialRequests } : {}),
            ...(passIdentifier ? { purchase_id: passIdentifier } : {}),
          };

          console.log("[DEV LOG - SALTROOM BOOKING REQUEST]", {
            url: `${API_BASE_URL}/bookings/saltroom/`,
            payload: saltPayload,
          });

          const saltRes = await appFetch(`${API_BASE_URL}/bookings/saltroom/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(saltPayload),
          });

          console.log("[DEV LOG - SALTROOM BOOKING RESPONSE STATUS]", saltRes.status);

          if (!saltRes.ok) {
            const errData = await saltRes.json().catch(() => ({}));
            console.log("[DEV LOG - SALTROOM BOOKING ERROR PAYLOAD]", errData);
            const rawErr = String(errData?.error || errData?.message || errData?.detail || "").toLowerCase();

            let localizedErr = t("bookingFlow.errors.genericFailure", { defaultValue: "Failed to create booking. Please try again." });
            if (rawErr.includes("weekly session limit") || rawErr.includes("weekly limit")) {
              localizedErr = t("bookingFlow.errors.weeklyLimitReached", { defaultValue: "Weekly session limit already reached for this week." });
            } else if (rawErr.includes("exhausted") || rawErr.includes("remaining sessions")) {
              localizedErr = t("bookingFlow.errors.noRemainingSessions", { defaultValue: "You have exhausted the sessions for this pass or subscription." });
            } else if (rawErr.includes("expired")) {
              localizedErr = t("bookingFlow.errors.subscriptionExpired", { defaultValue: "Your subscription has expired. Please renew to book." });
            } else if (rawErr.includes("remaining") && rawErr.includes("spot")) {
              localizedErr = t("bookingFlow.errors.slotUnavailable", { defaultValue: "This time slot is no longer available. Please select another time." });
            } else if (rawErr.includes("concurrent") || rawErr.includes("already booked")) {
              localizedErr = t("bookingFlow.errors.alreadyBooked", { defaultValue: "You already have an active booking for this time slot." });
            }

            throw new Error(localizedErr);
          }

          const saltJson = await saltRes.json();
          console.log("[DEV LOG - SALTROOM BOOKING SUCCESS PAYLOAD]", saltJson);

          setConfirmedBookingId(saltJson.booking_id || "SR-CONFIRMED");
          if (saltJson.remaining_sessions !== undefined) {
            setConfirmedRemainingSessions(saltJson.remaining_sessions);
          }

          setIsProcessing(false);
          setIsSuccess(true);
          return;
        }

        const celebration = storeState.celebration;
        const res = await appFetch(`${API_BASE_URL}/bookings/lunchroom/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_date: storeState.date || "2026-10-30",
            booking_time: bookingTime,
            capacity: storeState.guestsCount || 2,
            name: cardHolder.trim() || storeState.fullName || "Guest",
            email: storeState.email || "guest@example.com",
            phone: storeState.phone || "+31612345678",
            total_price: "0.00",
            special_request: storeState.specialRequests || undefined,
            ...(celebration?.isCelebrating
              ? {
                  celebration_type: celebration.occasion || undefined,
                  celebration_date: storeState.date || undefined,
                  name_of_celebrant: celebration.celebrantName || undefined,
                  age_of_celebrant: celebration.age ? parseInt(String(celebration.age), 10) : undefined,
                  hobbies: celebration.hobbiesInterests || undefined,
                  celebration_details: celebration.otherDetails || undefined,
                }
              : {}),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.message || "Failed to confirm table reservation.");
        }

        const json = await res.json();
        setConfirmedBookingId(json.booking_id || "LR-CONFIRMED");
        setIsProcessing(false);
        setIsSuccess(true);
        return;
      }

      // 2. Format booking_time and time_slot for paid bookings
      let bookingTime = "10:00:00";
      if (storeState.timeSlot) {
        const timeMatch = storeState.timeSlot.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          bookingTime = timeMatch[1].length === 4 ? `0${timeMatch[1]}:00` : `${timeMatch[1]}:00`;
        }
      }

      let timeSlotEnum: "90_mins" | "3_hours" | "4_hours" = "3_hours";
      if (isSharedSauna) {
        timeSlotEnum = "90_mins";
      } else if (durationHours === 4) {
        timeSlotEnum = "4_hours";
      }

      // 3. Create Booking & Generate Stripe PaymentIntent from Backend API
      let bookingRes: Response;
      if (isSauna) {
        const payload = {
          sauna_type: isSharedSauna ? "shared" : "private",
          booking_date: storeState.date || "2026-10-30",
          booking_time: bookingTime,
          time_slot: timeSlotEnum,
          capacity: guestsCount,
          name: cardHolder.trim() || storeState.fullName || "Guest",
          email: storeState.email || "guest@example.com",
          phone: storeState.phone || "+31612345678",
          special_request: storeState.specialRequests || null,
          selected_features: extrasList.map((e) => e.id),
          total_price: priceVal,
        };

        bookingRes = await appFetch(`${API_BASE_URL}/bookings/sauna/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (storeState.serviceType === "activity" || Boolean(storeState.activityDetails)) {
        const actId = storeState.activityDetails?.id || storeState.serviceId || 1;
        const parsedActId = typeof actId === "string" && !isNaN(Number(actId)) ? parseInt(actId, 10) : actId;

        const payload = {
          activity: parsedActId,
          capacity: storeState.guestsCount || 1,
          name: cardHolder.trim() || storeState.fullName || "Guest",
          email: storeState.email || "guest@example.com",
          phone: storeState.phone || "+31612345678",
          special_request: storeState.specialRequests || undefined,
          total_price: priceVal.toFixed(2),
        };

        bookingRes = await appFetch(`${API_BASE_URL}/bookings/activities/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (storeState.serviceType === "saltroom" || storeState.serviceType === "salt_room") {
        const payload = {
          name: cardHolder.trim() || storeState.fullName || "Guest",
          email: storeState.email || "guest@example.com",
          phone: storeState.phone || "+31612345678",
          date: storeState.date || "2026-10-30",
          start_time: bookingTime,
          capacity: Math.min(Math.max(guestsCount, 1), 2),
          payment_mode: paymentMethod === "ideal" ? "ideal" : "card",
          special_request: storeState.specialRequests || undefined,
        };

        bookingRes = await appFetch(`${API_BASE_URL}/bookings/saltroom/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (storeState.serviceType === "package" || storeState.serviceType === "packages") {
        const pkgSelections = storeState.packageSelections;

        let sauna_booking: any = undefined;
        if (pkgSelections?.saunaSlot) {
          sauna_booking = {
            sauna_type: pkgSelections.saunaSlot.type || "private",
            booking_time: pkgSelections.saunaSlot.startTime ? `${pkgSelections.saunaSlot.startTime}:00` : "14:00:00",
            time_slot: timeSlotEnum,
            capacity: guestsCount,
          };
        }

        let lunchroom_booking: any = undefined;
        if (pkgSelections?.lunchroomTime) {
          lunchroom_booking = {
            booking_time: `${pkgSelections.lunchroomTime}:00`,
            capacity: guestsCount,
          };
        }

        let activity_booking: any = undefined;
        if (pkgSelections?.activitySession) {
          activity_booking = {
            activity: pkgSelections.activitySession.id || 1,
            capacity: guestsCount,
          };
        }

        let saltroom_booking: any = undefined;
        if (pkgSelections?.saltRoomSlot) {
          const rawStart = pkgSelections.saltRoomSlot.startTime || "10:00";
          const formattedStart = rawStart.length === 5 ? `${rawStart}:00` : rawStart;
          const rawEnd = pkgSelections.saltRoomSlot.endTime;
          const formattedEnd = rawEnd ? (rawEnd.length === 5 ? `${rawEnd}:00` : rawEnd) : undefined;
          saltroom_booking = {
            start_time: formattedStart,
            ...(formattedEnd ? { end_time: formattedEnd } : {}),
          };
        }

        const pkgPayload: any = {
          name: cardHolder.trim() || storeState.fullName || "Guest",
          email: storeState.email || "guest@example.com",
          phone: storeState.phone || "+31612345678",
          date: storeState.date || "2026-10-30",
          guests: guestsCount,
          total_price: priceVal.toFixed(2),
          is_custom: false,
          notes: storeState.specialRequests || undefined,
          ...(sauna_booking ? { sauna_booking } : {}),
          ...(lunchroom_booking ? { lunchroom_booking } : {}),
          ...(activity_booking ? { activity_booking } : {}),
          ...(saltroom_booking ? { saltroom_booking } : {}),
        };

        bookingRes = await appFetch(`${API_BASE_URL}/bookings/packages/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkgPayload),
        });
      } else {
        bookingRes = await appFetch(`${API_BASE_URL}/bookings/sauna/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sauna_type: "private",
            booking_date: storeState.date || "2026-10-30",
            booking_time: bookingTime,
            time_slot: "3_hours",
            capacity: guestsCount,
            name: cardHolder.trim() || storeState.fullName || "Guest",
            email: storeState.email || "guest@example.com",
            phone: storeState.phone || "+31612345678",
            total_price: priceVal,
          }),
        });
      }

      if (!bookingRes.ok) {
        const errJson = await bookingRes.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.detail || "Server rejected booking creation.");
      }

      const bookingData = await bookingRes.json();
      const clientSecret = bookingData.client_secret;
      const bookingId = bookingData.booking_id;
      setConfirmedBookingId(bookingId || "PS-CONFIRMED");

      // 4. Authenticate & Confirm Payment via Stripe
      if (Platform.OS === "web") {
        const stripe = stripeInstance || (await getStripe());
        if (!stripe) {
          throw new Error("Stripe payment gateway could not be loaded. Please check your internet connection.");
        }

        if (paymentMethod === "ideal") {
          const returnUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/(bookings)/confirmation`
              : "http://localhost:8081/(bookings)/confirmation";

          const pmResult = await stripe.createPaymentMethod({
            type: "ideal",
            ideal: { bank: selectedBank },
            billing_details: {
              name: cardHolder.trim() || storeState.fullName || "Guest",
              email: storeState.email || "guest@example.com",
            },
          });

          if (pmResult.error) {
            throw new Error(pmResult.error.message || "Failed to create iDEAL payment method.");
          }

          const confirmRes = await stripe.confirmPayment({
            clientSecret,
            confirmParams: {
              payment_method: pmResult.paymentMethod.id,
              return_url: returnUrl,
            },
          });

          if (confirmRes.error) {
            throw new Error(confirmRes.error.message || "iDEAL confirmation error.");
          }
        } else {
          // Standard Stripe Elements flow (compliant with PCI requirements on Web)
          let confirmRes: any;
          const cardNumberElement = elementsInstance?.getElement?.(CardNumberElement);

          if (cardNumberElement) {
            confirmRes = await stripe.confirmCardPayment(clientSecret, {
              payment_method: {
                card: cardNumberElement,
                billing_details: {
                  name: cardHolder.trim() || storeState.fullName || "Guest",
                  email: storeState.email || "guest@example.com",
                  phone: storeState.phone || "+31612345678",
                  ...(postalCode.trim() ? { address: { postal_code: postalCode.trim() } } : {}),
                },
              },
            });
          } else {
            confirmRes = await stripe.confirmCardPayment(clientSecret);
          }

          if (confirmRes?.error) {
            throw new Error(confirmRes.error.message || "Stripe card transaction declined. Please check your card details.");
          }

          if (confirmRes?.paymentIntent && (confirmRes.paymentIntent.status === "succeeded" || confirmRes.paymentIntent.status === "processing")) {
            try {
              await appFetch(`${API_BASE_URL}/payments/confirm-payment/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  payment_intent_id: confirmRes.paymentIntent.id,
                  booking_id: bookingId,
                  purchase_id: bookingId,
                }),
              });
            } catch (e) {
              console.warn("Backend confirm sync notice:", e);
            }
          }
        }
      } else {
        // Native mobile flow (Android / iOS) via official @stripe/stripe-react-native SDK
        if (paymentMethod === "ideal") {
          throw new Error("iDEAL banking is available on web checkout. Please select Card payment on mobile.");
        }

        const nativeRes = await confirmMobilePayment(clientSecret, {
          name: cardHolder.trim() || storeState.fullName || "Guest",
          email: storeState.email || "guest@example.com",
          phone: storeState.phone || "+31612345678",
          address: {
            postalCode: postalCode.trim() || undefined,
          },
        });

        if (!nativeRes.success) {
          throw new Error(nativeRes.error || "Payment verification failed. Please check your card details.");
        }

        if (nativeRes.paymentIntent?.id) {
          try {
            await appFetch(`${API_BASE_URL}/payments/confirm-payment/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                payment_intent_id: nativeRes.paymentIntent.id,
                booking_id: bookingId,
                purchase_id: bookingId,
              }),
            });
          } catch (e) {
            console.warn("Backend confirm sync notice:", e);
          }
        }
      }

      setIsProcessing(false);
      setIsSuccess(true);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || "An unexpected error occurred during payment processing.");
    }
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
            <Text style={styles.successTitle}>{t("bookingFlow.general.bookingConfirmed", { defaultValue: "Booking Confirmed!" })}</Text>
            <Text style={styles.successSubtitle}>
              {t("bookingFlow.checkout.successSubtitle", { defaultValue: "Your payment has been successfully authorized and confirmed by Stripe. Your booking details and automated access code are reserved." })}
            </Text>

            <Card style={styles.successSummaryCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <Text style={[styles.serviceName, { flex: 1 }]}>{localizedServiceTitle}</Text>
                {confirmedBookingId ? (
                  <View style={styles.bookingIdBadge}>
                    <Text style={styles.bookingIdText}>{confirmedBookingId}</Text>
                  </View>
                ) : null}
              </View>

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
              <View style={styles.detailRow}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={[styles.detailValue, { color: "#059669", fontWeight: "700" }]}>
                  {t("bookingFlow.checkout.paymentStatusConfirmed", { defaultValue: "Payment Status: Confirmed & Paid" })}
                </Text>
              </View>
              {confirmedRemainingSessions !== null && (
                <View style={[styles.detailRow, { marginTop: 4 }]}>
                  <Zap size={16} color={brownGold} />
                  <Text style={[styles.detailValue, { color: brownGold, fontWeight: "600" }]}>
                    {t("bookingDetailPolicy.remainingCredits", { defaultValue: "Remaining credits: " })}
                    {String(confirmedRemainingSessions)}
                  </Text>
                </View>
              )}
            </Card>

            <Card style={styles.extraInfoCard}>
              <Text style={styles.extraInfoTitle}>
                {isSaltRoomReservation
                  ? t("bookingFlow.confirmation.saltRoomReminderTitle", { defaultValue: "Additional Information" })
                  : isLunchroomReservation
                  ? t("bookingFlow.confirmation.lunchroomReminderTitle", { defaultValue: "Additional Information" })
                  : t("bookingFlow.confirmation.wellnessReminderTitle", { defaultValue: "Additional Information" })}
              </Text>
              <Text style={styles.extraInfoText}>
                {isSaltRoomReservation
                  ? t("bookingFlow.confirmation.saltRoomReminderText", {
                      defaultValue: "Please arrive 10 minutes before your halotherapy session. Comfortable clothing is recommended. Please show your booking reference on arrival.",
                    })
                  : isLunchroomReservation
                  ? t("bookingFlow.confirmation.lunchroomReminderText", {
                      defaultValue: "Wednesday through Sunday (09:00–16:00). Walk-ins are welcome. Please present your booking reference upon arrival.",
                    })
                  : t("bookingFlow.confirmation.wellnessReminderText", {
                      defaultValue: "Please arrive 15 minutes before your scheduled session.",
                    })}
              </Text>
            </Card>

            <Button
              style={styles.doneBtn}
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>{t("bookingFlow.checkout.backToHome", { defaultValue: "Back to Home" })}</Text>
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
          subtitle={t("createBooking.confirmation.subtitle") || "Complete your reservation with confidence via Stripe"}
        />

        {errorMessage ? (
          <View style={styles.errorAlertCard}>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <AlertCircle size={20} color="#DC2626" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={styles.errorAlertTitle}>
                  {errorMessage.includes("072-3030548")
                    ? t("bookingFlow.lunchroomNotice.title", { defaultValue: "Planning to visit us today? ✨" })
                    : t("errors.title", { defaultValue: "Reservation Notice" })}
                </Text>
                <Text style={styles.errorAlertText}>{errorMessage}</Text>

                {errorMessage.includes("072-3030548") && (
                  <View style={styles.sameDayContactRow}>
                    <Pressable
                      style={styles.contactBtn}
                      onPress={() => Linking.openURL("tel:+31723030548")}
                    >
                      <Text style={styles.contactBtnText}>📞 072-3030548</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.contactBtn, { backgroundColor: "#25D366" }]}
                      onPress={() => Linking.openURL("https://wa.me/31723030548")}
                    >
                      <Text style={[styles.contactBtnText, { color: "#fff" }]}>
                        {t("bookingFlow.lunchroomNotice.whatsApp", { defaultValue: "WhatsApp" })}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {/* Booking Details Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.serviceName}>
            {localizedServiceTitle}
          </Text>

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
              <Text style={styles.detailValue}>
                {t("bookingFlow.saltroom.person", {
                  count: storeState.guestsCount,
                  defaultValue: `${storeState.guestsCount} ${storeState.guestsCount === 1 ? "Person" : "People"}`,
                })}
              </Text>
            </View>
          </View>

          {/* Package Sub-Services Breakdown */}
          {(storeState.serviceType === "package" || storeState.serviceType === "packages") && storeState.packageSelections && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDE7E1", gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#9B7C56", textTransform: "uppercase" }}>
                {t("bookingFlow.checkout.scheduledComponents", { defaultValue: "Scheduled Package Components" })}
              </Text>
              {storeState.packageSelections.saunaSlot && (
                <Text style={{ fontSize: 12, color: "#475569" }}>
                  • Sauna: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{storeState.packageSelections.saunaSlot.startTime} – {storeState.packageSelections.saunaSlot.endTime}</Text>
                </Text>
              )}
              {storeState.packageSelections.lunchroomTime && (
                <Text style={{ fontSize: 12, color: "#475569" }}>
                  • Lunchroom: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{storeState.packageSelections.lunchroomTime} {t("bookingFlow.checkout.arrival", { defaultValue: "Arrival" })}</Text>
                </Text>
              )}
              {storeState.packageSelections.saltRoomSlot && (
                <Text style={{ fontSize: 12, color: "#475569" }}>
                  • Salt Room: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{storeState.packageSelections.saltRoomSlot.startTime} – {storeState.packageSelections.saltRoomSlot.endTime || ""}</Text>
                </Text>
              )}
              {storeState.packageSelections.activitySession && (
                <Text style={{ fontSize: 12, color: "#475569" }}>
                  • Activity: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{storeState.packageSelections.activitySession.title}</Text>
                </Text>
              )}
            </View>
          )}
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
                  {t("bookingFlow.checkout.baseSession", { hours: durationHours, guests: 2, defaultValue: `${durationHours} Hours Base Session (2 Guests)` })}
                </Text>
                <Text style={styles.priceValue}>€{basePrice.toFixed(2)}</Text>
              </View>

              {extraGuestsCount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    {t("bookingFlow.checkout.extraGuestsLabel", { count: extraGuestsCount, fee: extraPersonFee, defaultValue: `Extra Guests (${extraGuestsCount} × €${extraPersonFee})` })}
                  </Text>
                  <Text style={styles.priceValue}>
                    +€{(extraGuestsCount * extraPersonFee).toFixed(2)}
                  </Text>
                </View>
              )}

              {extrasList.map((ext) => (
                <View key={ext.id} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>{t("bookingFlow.checkout.extraItem", { name: ext.name, defaultValue: `Extra: ${ext.name}` })}</Text>
                  <Text style={styles.priceValue}>+€{ext.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : isSharedSauna ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Sauna ({guestsCount} × €30.00)
              </Text>
              <Text style={styles.priceValue}>€{priceVal.toFixed(2)}</Text>
            </View>
          ) : storeState.serviceType === "activity" || Boolean(storeState.activityDetails) ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {storeState.serviceTitle} ({guestsCount} × €{((storeState.activityDetails?.price || priceVal / guestsCount) || 15).toFixed(2)})
              </Text>
              <Text style={styles.priceValue}>€{priceVal.toFixed(2)}</Text>
            </View>
          ) : (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{localizedServiceTitle}</Text>
              <Text style={styles.priceValue}>
                {isFree ? t("bookingFlow.checkout.free", { defaultValue: "Free" }) : `€${priceVal.toFixed(2)}`}
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

        {/* In-App Stripe Official Elements Gateway Section */}
        {!isFree && (
          <Card style={styles.stripeCard}>
            <StripeElementsCheckout
              cardHolder={cardHolder}
              setCardHolder={setCardHolder}
              postalCode={postalCode}
              setPostalCode={setPostalCode}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              selectedBank={selectedBank}
              setSelectedBank={setSelectedBank}
              errorMessage={errorMessage}
              onNativeCardChange={setNativeCardDetails}
              onElementsReady={(elements, stripe) => {
                setElementsInstance(elements);
                setStripeInstance(stripe);
              }}
            />
          </Card>
        )}

        {/* Cancellation, Rescheduling & Refund Policy */}
        <CancellationPolicyCard
          accepted={policyAccepted}
          onAcceptedChange={setPolicyAccepted}
          serviceName={storeState.serviceTitle}
        />

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

      <View style={[styles.footer, { borderTopColor: borderColor }]}>
        <Button onPress={handlePayAndConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {isFree
                ? t("bookingFlow.checkout.confirmTableReservation", { defaultValue: "Confirm Table Reservation" })
                : t("bookingFlow.checkout.payViaStripe", { amount: priceVal.toFixed(2), defaultValue: `Pay via Stripe (€${priceVal.toFixed(2)})` })}
            </Text>
          )}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  errorAlertCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    marginBottom: 16,
  },
  errorAlertTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#991B1B",
    fontFamily: Fonts.serif,
  },
  errorAlertText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#B91C1C",
  },
  sameDayContactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  contactBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
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
  stripeCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
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
  extraInfoCard: {
    width: "100%",
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EBE3DA",
    gap: 8,
    marginTop: 4,
  },
  extraInfoTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  extraInfoText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
  bookingIdBadge: {
    backgroundColor: "#FCF2E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EBE3DA",
    flexShrink: 0,
    alignSelf: "flex-start",
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9B7C56",
  },
  doneBtn: {
    width: "100%",
    backgroundColor: "#9B7C56",
    borderRadius: 25,
    marginTop: 24,
    marginBottom: 40,
  },
});
