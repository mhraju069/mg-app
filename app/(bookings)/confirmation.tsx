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
import StripeElementsCheckout from "@/components/booking/StripeElementsCheckout";
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
import React, { useState } from "react";
import {
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CardNumberElement } from "@stripe/react-stripe-js";

export default function ConfirmationScreen() {
  const textMuted = useColor("textMuted");
  const brownGold = "#9B7C56";
  const lightBeige = "#F8F5F2";
  const { t } = useTranslation();

  const storeState = useBookingStore.getState();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "ideal">("card");
  const [selectedBank, setSelectedBank] = useState<string>("ing");

  // Card details state
  const [cardHolder, setCardHolder] = useState<string>(storeState.fullName || "Akash");
  const [postalCode, setPostalCode] = useState<string>("1012AB");

  // Reference to Stripe instance and elements from checkout component
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [elementsInstance, setElementsInstance] = useState<any>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);

  const priceVal = storeState.price || 0;
  const isFree = storeState.isFree || priceVal === 0;

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
        "Please read and accept the Cancellation, Rescheduling & Refund Policy to proceed."
      );
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Handle Free Reservations (e.g. Lunchroom)
      if (isFree) {
        let bookingTime = "12:00:00";
        if (storeState.timeSlot) {
          const match = storeState.timeSlot.match(/(\d{1,2}:\d{2})/);
          if (match) {
            bookingTime = match[1].length === 4 ? `0${match[1]}:00` : `${match[1]}:00`;
          }
        }

        const celebration = storeState.celebration;
        const res = await fetch(`${API_BASE_URL}/bookings/lunchroom/`, {
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

        bookingRes = await fetch(`${API_BASE_URL}/bookings/sauna/`, {
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

        bookingRes = await fetch(`${API_BASE_URL}/bookings/activities/`, {
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

        bookingRes = await fetch(`${API_BASE_URL}/bookings/saltroom/`, {
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

        bookingRes = await fetch(`${API_BASE_URL}/bookings/packages/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pkgPayload),
        });
      } else {
        bookingRes = await fetch(`${API_BASE_URL}/bookings/sauna/`, {
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
        // Standard Stripe Elements flow (compliant with PCI requirements)
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
          // Fallback if elements not mounted
          confirmRes = await stripe.confirmCardPayment(clientSecret);
        }

        if (confirmRes?.error) {
          throw new Error(confirmRes.error.message || "Stripe card transaction declined. Please check your card details.");
        }

        if (confirmRes?.paymentIntent && (confirmRes.paymentIntent.status === "succeeded" || confirmRes.paymentIntent.status === "processing")) {
          // Notify backend that payment is verified so booking & payment statuses become 'paid' and 'confirmed'
          try {
            await fetch(`${API_BASE_URL}/payments/confirm-payment/`, {
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
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSubtitle}>
              Your payment has been successfully authorized and confirmed by Stripe. Your booking details and automated access code are reserved.
            </Text>

            <Card style={styles.successSummaryCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.serviceName}>{storeState.serviceTitle}</Text>
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
                  Payment Status: Confirmed & Paid
                </Text>
              </View>
            </Card>

            <Button
              style={styles.doneBtn}
              onPress={() => router.replace("/(tabs)/home")}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Back to Home</Text>
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

        {/* Booking Details Card */}
        <Card style={styles.summaryCard}>
          <Text style={styles.serviceName}>{storeState.serviceTitle}</Text>

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
              <Text style={styles.detailValue}>{storeState.guestsCount} Persons</Text>
            </View>
          </View>

          {/* Package Sub-Services Breakdown */}
          {(storeState.serviceType === "package" || storeState.serviceType === "packages") && storeState.packageSelections && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDE7E1", gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#9B7C56", textTransform: "uppercase" }}>
                Scheduled Package Components
              </Text>
              {storeState.packageSelections.saunaSlot && (
                <Text style={{ fontSize: 12, color: "#475569" }}>
                  • Sauna: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{storeState.packageSelections.saunaSlot.startTime} – {storeState.packageSelections.saunaSlot.endTime}</Text>
                </Text>
              )}
              {storeState.packageSelections.lunchroomTime && (
                <Text style={{ fontSize: 12, color: "#475569" }}>
                  • Lunchroom: <Text style={{ fontWeight: "700", color: "#1d1a17" }}>{storeState.packageSelections.lunchroomTime} Arrival</Text>
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
                  {durationHours} Hours Base Session (2 Guests)
                </Text>
                <Text style={styles.priceValue}>€{basePrice.toFixed(2)}</Text>
              </View>

              {extraGuestsCount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>
                    Extra Guests ({extraGuestsCount} × €{extraPersonFee})
                  </Text>
                  <Text style={styles.priceValue}>
                    +€{(extraGuestsCount * extraPersonFee).toFixed(2)}
                  </Text>
                </View>
              )}

              {extrasList.map((ext) => (
                <View key={ext.id} style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Extra: {ext.name}</Text>
                  <Text style={styles.priceValue}>+€{ext.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : isSharedSauna ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Shared Sauna ({guestsCount} × €30.00)
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
              <Text style={styles.priceLabel}>{storeState.serviceTitle}</Text>
              <Text style={styles.priceValue}>
                {isFree ? "Free" : `€${priceVal.toFixed(2)}`}
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

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handlePayAndConfirm} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {isFree
                ? "Confirm Table Reservation"
                : `Pay via Stripe (€${priceVal.toFixed(2)})`}
            </Text>
          )}
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  bookingIdBadge: {
    backgroundColor: "#FCF2E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBE3DA",
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
    marginTop: 10,
  },
});
