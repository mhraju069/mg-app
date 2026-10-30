import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Fonts } from "@/theme/colors";
import { useColor } from "@/hooks/useColor";
import {
  Check,
  CheckCircle2,
  Info,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react-native";

interface CancellationPolicyCardProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  serviceName?: string;
}

export default function CancellationPolicyCard({
  accepted,
  onAcceptedChange,
  serviceName,
}: CancellationPolicyCardProps) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [tempAccepted, setTempAccepted] = useState(accepted);

  const textMuted = useColor("textMuted");
  const border = useColor("border");
  const brownGold = "#9B7C56";

  const handleOpenModal = () => {
    setTempAccepted(accepted);
    setModalOpen(true);
  };

  const handleConfirmModal = () => {
    onAcceptedChange(tempAccepted);
    setModalOpen(false);
  };

  return (
    <>
      {/* Summary Card on Booking Review */}
      <Card style={[styles.cardContainer, { borderColor: border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBadge, { backgroundColor: "#FAF0E6" }]}>
              <ShieldCheck size={22} color={brownGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {t("bookingFlow.checkout.policyTitle", { defaultValue: "Cancellation, Rescheduling & Refund Policy" })}
              </Text>
              <Text style={[styles.cardSubtitle, { color: textMuted }]}>
                {t("bookingFlow.checkout.policySubtitle", { hours: "24 hours", defaultValue: "Cancellations or changes are permitted up to 24 hours before your scheduled time." })}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleOpenModal}
            style={[styles.readButton, { borderColor: brownGold }]}
          >
            <Text style={[styles.readButtonText, { color: brownGold }]}>
              {accepted ? t("bookingFlow.checkout.reviewPolicy", { defaultValue: "Review Policy" }) : t("bookingFlow.checkout.readPolicy", { defaultValue: "Read Policy" })}
            </Text>
          </Pressable>
        </View>

        {/* Status indicator bar / toggle */}
        <Pressable
          onPress={handleOpenModal}
          style={[
            styles.statusBar,
            accepted
              ? { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }
              : { backgroundColor: "#FAF7F2", borderColor: border },
          ]}
        >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.checkboxCircle,
                accepted
                  ? { backgroundColor: "#16A34A", borderColor: "#16A34A" }
                  : { backgroundColor: "#fff", borderColor: "#CBD5E1" },
              ]}
            >
              {accepted && <Check size={12} color="#fff" strokeWidth={3} />}
            </View>
            <Text
              style={[
                styles.statusText,
                { color: accepted ? "#15803D" : textMuted },
              ]}
            >
              {accepted ? t("bookingFlow.checkout.policyAccepted", { defaultValue: "Cancellation & refund terms accepted" }) : t("bookingFlow.checkout.policyPrompt", { defaultValue: "Tap to review & accept cancellation policy" })}
            </Text>
          </View>
          <Text style={[styles.statusAction, { color: brownGold }]}>
            {accepted ? t("bookingFlow.checkout.change", { defaultValue: "Change" }) : t("bookingFlow.checkout.review", { defaultValue: "Review ›" })}
          </Text>
        </Pressable>
      </Card>

      {/* Full Modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTitle}>
                  {t("bookingFlow.checkout.policyModalTitle", { defaultValue: "Cancellation, Rescheduling & Refund Policy" })}
                </Text>
                <Text style={[styles.modalSubtitle, { color: textMuted }]}>
                  {t("bookingFlow.checkout.policyModalSubtitle", { defaultValue: "Please read through our terms carefully before accepting." })}
                </Text>
              </View>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={styles.closeButton}
                hitSlop={8}
              >
                <X size={22} color="#64748B" />
              </Pressable>
            </View>

            {/* Modal Scrollable Body */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Important Notice Card */}
              <View style={styles.noticeBox}>
                <Info size={20} color={brownGold} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noticeTitle}>{t("bookingFlow.checkout.importantNotice", { defaultValue: "Important Notice:" })}</Text>
                  <Text style={styles.noticeText}>
                    Please cancel or reschedule at least{" "}
                    <Text style={{ fontWeight: "700" }}>24 hours</Text> before
                    your scheduled session to avoid losing your booked session
                    or credit. Late cancellations and missed appointments will
                    result in the booked session or credit being considered used,
                    including for members and session-pass holders.
                  </Text>
                </View>
              </View>

              {/* Section 1 */}
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>
                  {t("bookingFlow.checkout.fullPolicy.sec1Title", { defaultValue: "1. Cancellation and Rescheduling Policy" })}
                </Text>
                <Text style={styles.sectionLead}>
                  {t("bookingFlow.checkout.fullPolicy.sec1Lead", { hours: "24 hours", defaultValue: "Customers may cancel or reschedule a wellness reservation up to 24 hours before the scheduled start time." })}
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>
                    •{" "}
                    <Text style={{ fontWeight: "700", color: "#334155" }}>
                      {t("bookingFlow.checkout.fullPolicy.sec1Point1Title", { defaultValue: "More than 24 hours before the session:" })}
                    </Text>{" "}
                    {t("bookingFlow.checkout.fullPolicy.sec1Point1Text", { defaultValue: "Customers may cancel or reschedule their reservation in accordance with the applicable refund, credit, and booking policies." })}
                  </Text>
                  <Text style={styles.bulletItem}>
                    •{" "}
                    <Text style={{ fontWeight: "700", color: "#334155" }}>
                      {t("bookingFlow.checkout.fullPolicy.sec1Point2Title", { defaultValue: "Within 24 hours of the session:" })}
                    </Text>{" "}
                    {t("bookingFlow.checkout.fullPolicy.sec1Point2Text", { defaultValue: "Cancellations and rescheduling are no longer permitted free of charge. The applicable late cancellation policy will apply." })}
                  </Text>
                  <Text style={styles.bulletItem}>
                    •{" "}
                    <Text style={{ fontWeight: "700", color: "#334155" }}>
                      {t("bookingFlow.checkout.fullPolicy.sec1Point3Title", { defaultValue: "At or after the scheduled start time:" })}
                    </Text>{" "}
                    {t("bookingFlow.checkout.fullPolicy.sec1Point3Text", { defaultValue: "Cancellations or changes are not permitted under the standard cancellation policy." })}
                  </Text>
                </View>
              </View>

              {/* Section 2 */}
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>
                  {t("bookingFlow.checkout.fullPolicy.sec2Title", { defaultValue: "2. Policy for Members and Session-Pass Holders" })}
                </Text>
                <Text style={styles.sectionLead}>
                  {t("bookingFlow.checkout.fullPolicy.sec2Lead", { defaultValue: "The same 24-hour cancellation and rescheduling policy applies to all members and session-pass holders." })}
                </Text>
                <View style={styles.bulletList}>
                  <Text style={styles.bulletItem}>
                    •{" "}
                    <Text style={{ fontWeight: "700", color: "#334155" }}>
                      {t("bookingFlow.checkout.fullPolicy.sec2Point1Title", { defaultValue: "Timely cancellation (more than 24 hours in advance):" })}
                    </Text>{" "}
                    {t("bookingFlow.checkout.fullPolicy.sec2Point1Text", { defaultValue: "The session or credit used for the booking will be returned to the customer's account and made available for future bookings." })}
                  </Text>
                  <Text style={styles.bulletItem}>
                    •{" "}
                    <Text style={{ fontWeight: "700", color: "#334155" }}>
                      {t("bookingFlow.checkout.fullPolicy.sec2Point2Title", { defaultValue: "Late cancellation (within 24 hours):" })}
                    </Text>{" "}
                    {t("bookingFlow.checkout.fullPolicy.sec2Point2Text", { defaultValue: "The booked session or credit will be considered used and will not be restored." })}
                  </Text>
                  <Text style={styles.bulletItem}>
                    •{" "}
                    <Text style={{ fontWeight: "700", color: "#334155" }}>
                      {t("bookingFlow.checkout.fullPolicy.sec2Point3Title", { defaultValue: "No-show:" })}
                    </Text>{" "}
                    {t("bookingFlow.checkout.fullPolicy.sec2Point3Text", { defaultValue: "If a customer fails to attend without cancelling in accordance with the policy, the session or credit will not be restored." })}
                  </Text>
                </View>
              </View>

              {/* Section 3 */}
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>
                  {t("bookingFlow.checkout.fullPolicy.sec3Title", { defaultValue: "3. Refunds and Credits" })}
                </Text>
                <Text style={styles.sectionParagraph}>
                  {t("bookingFlow.checkout.fullPolicy.sec3Text", { defaultValue: "Refunds, credits, and the restoration of sessions are subject to the applicable payment, membership, and session-pass terms. A timely cancellation does not automatically guarantee a monetary refund. Eligible refunds or credits will be processed according to the rules applicable to the original booking and payment method." })}
                </Text>
              </View>

              {/* Section 4 */}
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>
                  {t("bookingFlow.checkout.fullPolicy.sec4Title", { defaultValue: "4. Booking Confirmation and Customer Acknowledgment" })}
                </Text>
                <Text style={styles.sectionParagraph}>
                  {t("bookingFlow.checkout.fullPolicy.sec4Text", { defaultValue: "The cancellation and rescheduling policy is displayed during the booking process and included in the booking confirmation. By completing a reservation, customers acknowledge that they have read and accepted the applicable cancellation, rescheduling, refund, and credit rules." })}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer with Checkbox & Action Button */}
            <View style={styles.modalFooter}>
              <Pressable
                onPress={() => setTempAccepted(!tempAccepted)}
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    tempAccepted
                      ? { backgroundColor: brownGold, borderColor: brownGold }
                      : { backgroundColor: "#fff", borderColor: "#CBD5E1" },
                  ]}
                >
                  {tempAccepted && <Check size={14} color="#fff" strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>
                  {t("bookingFlow.checkout.fullPolicy.agreeCheckbox", { policyName: t("bookingFlow.checkout.policyTitle", { defaultValue: "Cancellation, Rescheduling & Refund Policy" }), defaultValue: "I have read, understood, and accept the Cancellation, Rescheduling & Refund Policy, including the 24-hour notice requirement." })}
                </Text>
              </Pressable>

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => setModalOpen(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Close</Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmModal}
                  disabled={!tempAccepted}
                  style={[
                    styles.confirmBtn,
                    tempAccepted
                      ? { backgroundColor: brownGold }
                      : { backgroundColor: "#CBD5E1" },
                  ]}
                >
                  <Text
                    style={[
                      styles.confirmBtnText,
                      { color: tempAccepted ? "#fff" : "#64748B" },
                    ]}
                  >
                    {t("bookingFlow.checkout.fullPolicy.confirmAndAcceptBtn", { defaultValue: "Confirm & Accept" })}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 18,
    borderRadius: 20,
    gap: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
  },
  cardHeader: {
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.title,
    color: "#1d1a17",
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  readButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  readButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  statusAction: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    maxHeight: "88%",
    width: "100%",
    maxWidth: 500,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1EDE8",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.title,
    color: "#1d1a17",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  modalBody: {
    maxHeight: 400,
  },
  modalBodyContent: {
    padding: 20,
    gap: 16,
  },
  noticeBox: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FAF0E6",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#8B7355",
  },
  policySection: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8E2DC",
    gap: 6,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#0F172A",
  },
  sectionLead: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 18,
  },
  bulletList: {
    gap: 6,
    marginTop: 4,
  },
  bulletItem: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 16,
  },
  sectionParagraph: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 18,
  },
  modalFooter: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#F1EDE8",
    gap: 14,
    backgroundColor: "#fff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FAF8F5",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxLabel: {
    fontSize: 12,
    color: "#0F172A",
    lineHeight: 17,
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  confirmBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
