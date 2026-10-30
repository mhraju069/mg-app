import { Layout } from "@/components/layout/Layout";
import { useTranslation } from "react-i18next";
import { BackHeader } from "@/components/shared/booking-header";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { router, useLocalSearchParams } from "expo-router";
import {
  Calendar,
  Clock,
  Copy,
  Timer,
  Users,
  Zap,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  ShieldAlert,
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";
import {
  dashboardApi,
  CancelBookingResponse,
} from "@/utils/dashboardApi";

export default function BookingDetailsScreen() {
  const params = useLocalSearchParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] =
    useState<CancelBookingResponse | null>(null);

  const { t } = useTranslation();

  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";
  const lightBeige = "#FCF2E9";

  const [bookingDetail, setBookingDetail] = useState<{
    booking_id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    guests: string;
    status: string;
    amount: string;
    accessCode: string | null;
  }>({
    booking_id: (params.id as string) || "",
    title: (params.title as string) || "Wellness Experience",
    date: (params.date as string) || "Today",
    time: (params.time as string) || "10:00 AM",
    duration: "120 minutes",
    guests: (params.guests as string) || "2",
    status:
      (params.paymentStatus as string) ||
      (params.status as string) ||
      "Confirmed",
    amount: params.total_price ? `€${params.total_price}` : "",
    accessCode: (params.access_code as string) || (params.id as string) || null,
  });

  useEffect(() => {
    // If opened directly, fetch from unified user dashboard
    const fetchLatest = async () => {
      try {
        const data = await dashboardApi.getUserDashboard();
        if (data) {
          const all = [
            ...(data.my_bookings?.upcoming || []),
            ...(data.my_bookings?.past || []),
          ];
          const found = all.find(
            (b) =>
              String(b.booking_id) === String(params.id) ||
              String(b.id) === String(params.id)
          );
          if (found) {
            setBookingDetail({
              booking_id: found.booking_id,
              title: (found.service_name || "Wellness Experience").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              date: found.date,
              time: found.time || "10:00 AM",
              duration: found.details?.time_slot
                ? found.details.time_slot.replace(/_/g, " ")
                : "120 minutes",
              guests: String(found.guests),
              status: found.payment_status
                ? found.payment_status.replace(/_/g, " ")
                : found.status,
              amount:
                found.total_price && Number(found.total_price) > 0
                  ? `€${found.total_price}`
                  : "",
              accessCode: found.access_code || found.booking_id,
            });
          }
        }
      } catch (e) {
        console.warn("Could not reload booking details:", e);
      }
    };

    fetchLatest();
  }, [params.id]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    toast.success("Copied to clipboard");
  };

  const handleOpenCancelModal = () => {
    setCancelError(null);
    setCancelSuccess(null);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    if (isCancelling) return;
    setShowCancelModal(false);
    if (cancelSuccess) {
      router.back();
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    setCancelSuccess(null);

    const targetId =
      bookingDetail.booking_id ||
      (params.id as string) ||
      bookingDetail.accessCode ||
      "";

    try {
      const res = await dashboardApi.cancelBooking(targetId, cancelReason);

      if (res.success) {
        setCancelSuccess(res);
        setBookingDetail((prev) => ({ ...prev, status: "Cancelled" }));
        toast.success("Reservation cancelled successfully");
      } else {
        setCancelError(
          res.message ||
            "Cancellation could not be completed. Please check policy requirements."
        );
      }
    } catch (e: any) {
      setCancelError(
        e?.message ||
          "An unexpected error occurred while processing cancellation."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancelled =
    bookingDetail.status.toLowerCase().includes("cancel");

  const isPaid =
    bookingDetail.status.toLowerCase().includes("paid") ||
    bookingDetail.status.toLowerCase().includes("confirm");

  return (
    <View style={styles.container}>
      <BackHeader />
      <Layout>
        <Text style={styles.screenTitle}>{t("booking.details.title")}</Text>

        <Card style={styles.infoCard}>
          <View style={styles.titleStatusRow}>
            <Text style={styles.serviceTitle}>{bookingDetail.title}</Text>
            <View
              style={[
                styles.badge,
                isCancelled ? styles.badgeCancelled : styles.badgeConfirmed,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isCancelled
                    ? styles.badgeTextCancelled
                    : styles.badgeTextConfirmed,
                ]}
              >
                {isCancelled ? "Cancelled" : "Confirmed"}
              </Text>
            </View>
          </View>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
                <Calendar size={18} color={brownGold} />
              </View>
              <View>
                <Text variant="caption" style={{ color: textMuted }}>
                  {t("booking.details.labels.date")}
                </Text>
                <Text style={styles.detailValue}>{bookingDetail.date}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
                <Clock size={18} color={brownGold} />
              </View>
              <View>
                <Text variant="caption" style={{ color: textMuted }}>
                  {t("booking.details.labels.time")}
                </Text>
                <Text style={styles.detailValue}>{bookingDetail.time}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
                <Timer size={18} color={brownGold} />
              </View>
              <View>
                <Text variant="caption" style={{ color: textMuted }}>
                  {t("booking.details.labels.duration")}
                </Text>
                <Text style={styles.detailValue}>{bookingDetail.duration}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
                <Users size={18} color={brownGold} />
              </View>
              <View>
                <Text variant="caption" style={{ color: textMuted }}>
                  {t("booking.details.labels.guests")}
                </Text>
                <Text style={styles.detailValue}>{bookingDetail.guests}</Text>
              </View>
            </View>
          </View>
        </Card>

        {bookingDetail.accessCode && !isCancelled && (
          <Card style={{ backgroundColor: brownGold }}>
            <View style={styles.accessCodeHeader}>
              <Zap size={20} color="white" />
              <Text style={styles.accessCodeTitle}>{t("access.label")}</Text>
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{bookingDetail.accessCode}</Text>
              <Pressable
                style={styles.copyButton}
                onPress={() => copyToClipboard(String(bookingDetail.accessCode))}
              >
                <Copy size={14} color="#fff" />
                <Text style={styles.copyText}>{t("access.copy")}</Text>
              </Pressable>
            </View>

            <Text style={styles.accessCodeDesc}>
              {t("access.instruction")}
            </Text>
          </Card>
        )}

        <Card style={[styles.paymentCard, { borderColor: border }]}>
          <View style={styles.paymentHeader}>
            <View style={styles.paymentIconRow}>
              <CreditCard size={18} color={textMuted} />
              <Text style={styles.paymentLabel}>
                {t("booking.details.labels.payment")}
              </Text>
            </View>
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={{ color: textMuted }}>
                {t("booking.details.labels.status")}
              </Text>
              <Text
                style={[
                  styles.paymentStatus,
                  isCancelled
                    ? { color: "#DC2626", fontWeight: "700" }
                    : isPaid
                    ? { color: "#166534", fontWeight: "700" }
                    : {},
                ]}
              >
                {bookingDetail.status}
              </Text>
            </View>
            {bookingDetail.amount ? (
              <View style={styles.paymentRow}>
                <Text style={{ color: textMuted }}>
                  {t("booking.details.labels.amount")}
                </Text>
                <Text style={styles.amountText}>{bookingDetail.amount}</Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Cancellation Policy and Action */}
        <Card style={styles.policyCard}>
          <View style={styles.policySection}>
            <View style={styles.policyTitleRow}>
              <ShieldAlert size={18} color={brownGold} />
              <Text style={styles.policyTitle}>Cancellation Policy</Text>
            </View>
            <Text style={[styles.policyText, { color: textMuted }]}>
              {t("bookingDetailPolicy.policyText", { defaultValue: "Reservations may be cancelled up to 24 hours prior to start time. Timely cancellations restore session credits or process refunds according to booking terms. Cancellations within 24 hours cannot be refunded." })}
            </Text>
          </View>

          {!isCancelled && (
            <Pressable
              style={styles.cancelLink}
              onPress={handleOpenCancelModal}
            >
              <Text style={styles.cancelLinkText}>
                {t("bookingDetailPolicy.cancelLink", { defaultValue: "Cancel Reservation ›" })}
              </Text>
            </Pressable>
          )}
        </Card>
      </Layout>

      {/* Cancellation Modal matching Website exactly */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {cancelSuccess ? t("bookingDetailPolicy.modalTitleCancelled", { defaultValue: "Reservation Cancelled" }) : t("bookingDetailPolicy.modalTitleCancel", { defaultValue: "Cancel Reservation" })}
              </Text>
              <Pressable
                onPress={handleCloseCancelModal}
                disabled={isCancelling}
                hitSlop={8}
                style={styles.closeIconBtn}
              >
                <X size={20} color="#64748B" />
              </Pressable>
            </View>

            {/* Success State */}
            {cancelSuccess ? (
              <View style={styles.successStateContainer}>
                <View style={styles.successBox}>
                  <View style={styles.successTitleRow}>
                    <CheckCircle2 size={18} color="#15803D" />
                    <Text style={styles.successTitle}>
                      {t("bookingDetailPolicy.cancelledSuccessTitle", { defaultValue: "Cancelled Successfully" })}
                    </Text>
                  </View>
                  <Text style={styles.successMessage}>
                    {cancelSuccess.message}
                  </Text>
                  {cancelSuccess.credit_restored && (
                    <View style={styles.creditRestoredBox}>
                      <Text style={styles.creditRestoredText}>
                        {t("bookingDetailPolicy.creditRefundedText", { defaultValue: "✓ 1 session credit has been refunded to your account." })}
                      </Text>
                      {cancelSuccess.remaining_sessions !== undefined && (
                        <Text style={styles.creditRestoredSub}>
                          Remaining credits:{" "}
                          <Text style={{ fontWeight: "700" }}>
                            {cancelSuccess.remaining_sessions}
                          </Text>
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                <Pressable
                  onPress={handleCloseCancelModal}
                  style={[styles.modalKeepButton, { backgroundColor: brownGold }]}
                >
                  <Text style={styles.modalKeepText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              /* Confirmation & Form State */
              <View style={styles.formStateContainer}>
                {/* Booking Info Box */}
                <View style={styles.bookingRefBox}>
                  <Text style={styles.bookingRefText}>
                    Booking Reference:{" "}
                    <Text style={styles.boldMono}>
                      {bookingDetail.booking_id || params.id}
                    </Text>
                  </Text>
                  <Text style={styles.bookingRefText}>
                    Experience:{" "}
                    <Text style={styles.boldText}>{bookingDetail.title}</Text>
                  </Text>
                  <Text style={styles.bookingRefText}>
                    Scheduled:{" "}
                    <Text style={styles.boldText}>
                      {bookingDetail.date} at {bookingDetail.time}
                    </Text>
                  </Text>
                </View>

                {/* 24-Hour Policy Notice Box */}
                <View style={styles.policyNoticeBox}>
                  <Info size={16} color={brownGold} style={{ marginTop: 2 }} />
                  <Text style={styles.policyNoticeText}>
                    <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                      {t("bookingDetailPolicy.noticeHeading", { defaultValue: "Notice:" })}{" "}
                    </Text>
                    {t("bookingDetailPolicy.noticeText", { defaultValue: "Cancellations must be made at least 24 hours prior to start time to receive a session refund/credit. Cancellations within 24 hours cannot be restored." })}
                  </Text>
                </View>

                {/* Optional Reason Input */}
                <View style={styles.reasonBlock}>
                  <Text style={styles.reasonLabel}>
                    Reason for cancellation{" "}
                    <Text style={{ fontWeight: "400", color: "#94A3B8" }}>
                      (optional)
                    </Text>
                  </Text>
                  <TextInput
                    style={styles.reasonInput}
                    multiline
                    numberOfLines={2}
                    value={cancelReason}
                    onChangeText={setCancelReason}
                    placeholder={t("bookingDetailPolicy.reasonPlaceholder", { defaultValue: "e.g. Schedule conflict, feeling unwell..." })}
                    placeholderTextColor="#94A3B8"
                    editable={!isCancelling}
                  />
                </View>

                {/* Backend Error Banner */}
                {cancelError && (
                  <View style={styles.errorBox}>
                    <AlertCircle size={18} color="#B91C1C" />
                    <Text style={styles.errorText}>{cancelError}</Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.modalActionsRow}>
                  <Pressable
                    style={styles.modalKeepBtnSecondary}
                    onPress={handleCloseCancelModal}
                    disabled={isCancelling}
                  >
                    <Text style={styles.modalKeepBtnText}>
                      Keep Reservation
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.modalConfirmCancelBtn,
                      isCancelling && { opacity: 0.6 },
                    ]}
                    onPress={handleConfirmCancel}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <View style={styles.cancellingRow}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.modalConfirmCancelText}>
                          {t("bookingDetailPolicy.cancellingBtn", { defaultValue: "Cancelling..." })}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.modalConfirmCancelText}>
                        {t("bookingDetailPolicy.confirmCancelBtn", { defaultValue: "Confirm Cancellation" })}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.title,
    marginTop: 36,
  },
  titleStatusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeConfirmed: {
    backgroundColor: "#F0FDF4",
  },
  badgeCancelled: {
    backgroundColor: "#FEF2F2",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextConfirmed: {
    color: "#166534",
  },
  badgeTextCancelled: {
    color: "#DC2626",
  },
  infoCard: {
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.title,
    flex: 1,
  },
  detailList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  accessCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  accessCodeTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  codeText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.mono,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyText: {
    color: "white",
    fontSize: 12,
  },
  accessCodeDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 16,
  },
  paymentCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  paymentInfo: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9B7C56",
  },
  policyCard: {
    padding: 20,
    borderRadius: 20,
    gap: 14,
  },
  policySection: {
    gap: 8,
  },
  policyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  policyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  cancelLinkText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.title,
    color: "#1d1a17",
  },
  closeIconBtn: {
    padding: 4,
  },
  successStateContainer: {
    gap: 16,
  },
  successBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 8,
  },
  successTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#14532D",
  },
  successMessage: {
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
  },
  creditRestoredBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(187,247,208,0.7)",
    paddingTop: 8,
    gap: 4,
  },
  creditRestoredText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
  },
  creditRestoredSub: {
    fontSize: 12,
    color: "#166534",
  },
  formStateContainer: {
    gap: 12,
  },
  bookingRefBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E8E2DC",
    gap: 4,
  },
  bookingRefText: {
    fontSize: 12,
    color: "#64748B",
  },
  boldMono: {
    fontFamily: Fonts.mono,
    fontWeight: "700",
    color: "#1d1a17",
  },
  boldText: {
    fontWeight: "600",
    color: "#1d1a17",
  },
  policyNoticeBox: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FAF0E6",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  policyNoticeText: {
    fontSize: 11,
    color: "#8B7355",
    lineHeight: 16,
    flex: 1,
  },
  reasonBlock: {
    gap: 6,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#0F172A",
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#fff",
    textAlignVertical: "top",
    minHeight: 56,
  },
  errorBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
    flex: 1,
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalKeepBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalKeepBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1d1a17",
  },
  modalConfirmCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmCancelText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  cancellingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalKeepButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalKeepText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});
