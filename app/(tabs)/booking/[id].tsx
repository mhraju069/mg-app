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
} from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { Modal, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";
import { dashboardApi, DashboardBookingItem } from "@/utils/dashboardApi";

export default function BookingDetailsScreen() {
  const params = useLocalSearchParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { t } = useTranslation();

  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";
  const lightBeige = "#FCF2E9";

  const [bookingDetail, setBookingDetail] = useState<{
    title: string;
    date: string;
    time: string;
    duration: string;
    guests: string;
    status: string;
    amount: string;
    accessCode: string | null;
  }>({
    title: (params.title as string) || "Wellness Experience",
    date: (params.date as string) || "Today",
    time: (params.time as string) || "10:00 AM",
    duration: "120 minutes",
    guests: (params.guests as string) || "2",
    status: (params.paymentStatus as string) || (params.status as string) || "Confirmed",
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
            (b) => String(b.booking_id) === String(params.id) || String(b.id) === String(params.id)
          );
          if (found) {
            setBookingDetail({
              title: found.service_name,
              date: found.date,
              time: found.time || "10:00 AM",
              duration: found.details?.time_slot ? found.details.time_slot.replace(/_/g, " ") : "120 minutes",
              guests: String(found.guests),
              status: found.payment_status ? found.payment_status.replace(/_/g, " ") : found.status,
              amount: found.total_price && Number(found.total_price) > 0 ? `€${found.total_price}` : "",
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

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      const targetId = (params.id as string) || bookingDetail.accessCode || "";
      const success = await dashboardApi.cancelBooking(targetId);
      if (success) {
        toast.success("Booking cancelled successfully.");
        setBookingDetail((prev) => ({ ...prev, status: "Cancelled" }));
      } else {
        toast.error("Failed to cancel booking. Please contact support.");
      }
    } catch {
      toast.error("Error cancelling booking.");
    } finally {
      setIsCancelling(false);
      setShowCancelModal(false);
      router.back();
    }
  };

  const isPaid =
    bookingDetail.status.toLowerCase().includes("paid") ||
    bookingDetail.status.toLowerCase().includes("confirm");

  return (
    <View style={styles.container}>
      <BackHeader />
      <Layout>
        <Text style={styles.screenTitle}>{t("booking.details.title")}</Text>

        <Card style={styles.infoCard}>
          <Text style={styles.serviceTitle}>{bookingDetail.title}</Text>

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

        {bookingDetail.accessCode && (
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
              <Text style={styles.paymentLabel}>{t("booking.details.labels.payment")}</Text>
            </View>
          </View>

          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={{ color: textMuted }}>{t("booking.details.labels.status")}</Text>
              <Text
                style={[
                  styles.paymentStatus,
                  isPaid ? { color: "#166534", fontWeight: "700" } : {},
                ]}
              >
                {bookingDetail.status}
              </Text>
            </View>
            {bookingDetail.amount ? (
              <View style={styles.paymentRow}>
                <Text style={{ color: textMuted }}>{t("booking.details.labels.amount")}</Text>
                <Text style={styles.amountText}>{bookingDetail.amount}</Text>
              </View>
            ) : null}
          </View>
        </Card>

        <Card>
          <View style={styles.policySection}>
            <Text style={styles.policyTitle}>{t("booking.details.policy.title")}</Text>
            <Text style={[styles.policyText, { color: textMuted }]}>
              {t("booking.details.policy.text")}
            </Text>
          </View>

          <Pressable
            style={styles.cancelLink}
            onPress={() => setShowCancelModal(true)}
          >
            <Text style={styles.cancelLinkText}>{t("booking.details.policy.button")}</Text>
          </Pressable>
        </Card>
      </Layout>

      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("booking.details.modal.title")}</Text>
            <Text style={[styles.modalSubtitle, { color: textMuted }]}>
              {t("booking.details.modal.subtitle")}
            </Text>
            <Text style={[styles.modalWarning, { color: textMuted }]}>
              {t("booking.details.modal.warning")}
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalKeepButton}
                onPress={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                <Text style={styles.modalKeepText}>{t("booking.details.modal.keep")}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalCancelButton, isCancelling && { opacity: 0.6 }]}
                onPress={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Text style={styles.modalCancelText}>{t("booking.details.modal.cancel")}</Text>
                )}
              </Pressable>
            </View>
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
  infoCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.title,
    marginBottom: 4,
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
    color: "#1E293B",
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
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    letterSpacing: 2,
    fontFamily: Fonts.mono || undefined,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
  policySection: {
    gap: 6,
    marginBottom: 16,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  policyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  cancelLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelLinkText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  modalWarning: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 12,
  },
  modalActions: {
    gap: 10,
  },
  modalKeepButton: {
    backgroundColor: "#9B7C56",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalKeepText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  modalCancelButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
});
