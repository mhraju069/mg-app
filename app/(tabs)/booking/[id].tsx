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
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet } from "react-native";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";

export default function BookingDetailsScreen() {
  const { id, type } = useLocalSearchParams();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { t } = useTranslation();

  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";
  const lightBeige = "#FCF2E9";

  const isPaid = id === "1";
  const booking = {
    title: isPaid ? "Private Sauna" : "Lunchroom Reservation",
    date: isPaid ? "Sunday 20 February 2026" : "Friday 20 February 2026",
    time: isPaid ? "10:00 PM" : "1:00 PM",
    duration: isPaid ? "120 minutes" : "90 minutes",
    guests: isPaid ? "2" : "4",
    status: isPaid ? "Paid in Full" : "Pay on arrival",
    amount: isPaid ? "€89" : "",
    accessCode: isPaid ? "SRN-2468" : null,
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    toast.success("copied");
  };

  return (
    <View style={styles.container}>
      <BackHeader />
      <Layout>
        <Text style={styles.screenTitle}>{t("booking.details.title")}</Text>

        <Card style={styles.infoCard}>
          <Text style={styles.serviceTitle}>{booking.title}</Text>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: lightBeige }]}>
                <Calendar size={18} color={brownGold} />
              </View>
              <View>
                <Text variant="caption" style={{ color: textMuted }}>
                  {t("booking.details.labels.date")}
                </Text>
                <Text style={styles.detailValue}>{booking.date}</Text>
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
                <Text style={styles.detailValue}>{booking.time}</Text>
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
                <Text style={styles.detailValue}>{booking.duration}</Text>
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
                <Text style={styles.detailValue}>{booking.guests}</Text>
              </View>
            </View>
          </View>
        </Card>

        {booking.accessCode && (
          <Card style={{ backgroundColor: brownGold }}>
            <View style={styles.accessCodeHeader}>
              <Zap size={20} color="white" />
              <Text style={styles.accessCodeTitle}>{t("access.label")}</Text>
            </View>

            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{booking.accessCode}</Text>
              <Pressable
                style={styles.copyButton}
                onPress={() => copyToClipboard(String(booking.accessCode))}
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
                {booking.status}
              </Text>
            </View>
            {booking.amount ? (
              <View style={styles.paymentRow}>
                <Text style={{ color: textMuted }}>{t("booking.details.labels.amount")}</Text>
                <Text style={styles.amountText}>{booking.amount}</Text>
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
      //   presentationStyle="pageSheet"
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
              >
                <Text style={styles.modalKeepText}>{t("booking.details.modal.keep")}</Text>
              </Pressable>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCancelModal(false);
                  router.back();
                }}
              >
                <Text style={styles.modalCancelText}>{t("booking.details.modal.cancel")}</Text>
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
  fixedHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: -4,
  },
  backText: {
    fontSize: 18,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.title,
    marginTop: 36,
  },
  infoCard: {
    //  marginTop: 24,
    //  marginBottom: 20,
    gap: 20,
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
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  accessCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accessCodeTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.9,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    letterSpacing: 2,
    fontFamily: Fonts.serif,
    width: "60%",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  copyText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  accessCodeDesc: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
  paymentCard: {
    //  marginBottom: 24,
  },
  paymentHeader: {
    marginBottom: 16,
  },
  paymentIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3F3F46",
  },
  paymentInfo: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentStatus: {
    fontSize: 16,
    fontWeight: "600",
  },
  amountText: {
    fontSize: 18,
    fontWeight: "800",
  },
  policySection: {
    marginBottom: 24,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
  },
  cancelLink: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelLinkText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 32,
    padding: 32,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.title,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
    fontFamily: Fonts.subtitle,
  },
  modalWarning: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  modalKeepButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalKeepText: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalCancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});
