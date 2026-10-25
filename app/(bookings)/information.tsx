import { Layout } from "@/components/layout/Layout";
import { BackHeader } from "@/components/shared/booking-header";
import { useTranslation } from "react-i18next";
import Header from "@/components/shared/inside-header";
import { AvoidKeyboard } from "@/components/ui/avoid-keyboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Card } from "@/components/ui/card";
import { useColor } from "@/hooks/useColor";
import { Fonts } from "@/theme/colors";
import { useBookingStore } from "@/utils/bookingStore";
import { API_BASE_URL } from "@/utils/constants";
import { router } from "expo-router";
import {
  ArrowRight,
  Clock,
  Users,
  ShieldCheck,
  Calendar as CalendarIcon,
  Sparkles,
  AlertCircle,
  Cake,
  Gift,
  Check,
  Footprints,
} from "lucide-react-native";
import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Pressable, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "Promotion / Career Milestone",
  "Baby Shower",
  "Engagement / Romantic Celebration",
  "Retirement",
  "Other Special Event",
];

function generateTimeSlots(openTime?: string, closeTime?: string, intervalMinutes = 60): string[] {
  if (!openTime || !closeTime) return ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
  const [startH, startM] = openTime.split(":").map(Number);
  const [endH, endM] = closeTime.split(":").map(Number);
  if (isNaN(startH) || isNaN(endH)) return ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  const slots: string[] = [];
  for (let m = startMinutes; m <= endMinutes; m += intervalMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots.length > 0 ? slots : ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
}

export default function InformationScreen() {
  const { t } = useTranslation();
  const storeState = useBookingStore.getState();
  const brownGold = "#9B7C56";
  const textMuted = useColor("textMuted");
  const todayStr = new Date().toISOString().split("T")[0];

  const isLunchroom = storeState.serviceType === "lunchroom" || storeState.serviceTitle.toLowerCase().includes("lunchroom");
  const isActivity = storeState.serviceType === "activity" || Boolean(storeState.activityDetails);
  const act = storeState.activityDetails;

  // Contact State
  const [fullName, setFullName] = useState(storeState.fullName || "Akash");
  const [email, setEmail] = useState(storeState.email || "akash@example.com");
  const [phone, setPhone] = useState(storeState.phone || "+31 6 12345678");
  const [specialRequests, setSpecialRequests] = useState(storeState.specialRequests || "");

  // Lunchroom Table Reservation State
  const [reservationDate, setReservationDate] = useState<string>(storeState.date || todayStr);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [timeSlot, setTimeSlot] = useState<string>(storeState.timeSlot || "12:00");
  const [lunchGuests, setLunchGuests] = useState<number>(storeState.guestsCount || 2);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [lunchroomOpenTime, setLunchroomOpenTime] = useState<string | undefined>("10:00");
  const [lunchroomCloseTime, setLunchroomCloseTime] = useState<string | undefined>("22:00");
  const [lunchroomIsClosed, setLunchroomIsClosed] = useState<boolean>(false);
  const [lunchroomIsBlocked, setLunchroomIsBlocked] = useState<boolean>(false);
  const [lunchroomBlockMsg, setLunchroomBlockMsg] = useState<string>("");

  // Celebration State (for Lunchroom)
  const [isCelebrating, setIsCelebrating] = useState<boolean>(false);
  const [occasion, setOccasion] = useState<string>("Birthday");
  const [celebrantName, setCelebrantName] = useState<string>("");
  const [celebrantAge, setCelebrantAge] = useState<string>("");
  const [hobbies, setHobbies] = useState<string>("");
  const [otherCelebrationNotes, setOtherCelebrationNotes] = useState<string>("");

  // Activity tickets count
  const maxAllowedTickets = act?.availableSlots !== undefined ? act.availableSlots : Math.max(1, (act?.maxParticipants || 10) - (act?.bookedParticipants || 0));
  const [ticketCount, setTicketCount] = useState<number>(storeState.guestsCount || 1);

  const singlePrice = act?.price || storeState.price || 15;
  const totalCalculated = isActivity ? singlePrice * ticketCount : isLunchroom ? 0 : storeState.price;

  // Fetch live Lunchroom slots for the selected reservation date
  const fetchLunchroomSlots = useCallback(async (targetDate: string) => {
    if (!targetDate) return;
    setLoadingSlots(true);
    setLunchroomIsBlocked(false);
    setLunchroomIsClosed(false);
    setLunchroomBlockMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/services/slots/?type=lunchroom&date=${targetDate}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        const isBlocked = Boolean(json.is_blocked || data.is_blocked);
        const isClosed = Boolean(json.is_closed || data.is_closed);

        setLunchroomIsBlocked(isBlocked);
        setLunchroomIsClosed(isClosed);
        setLunchroomOpenTime(data.open_time || json.open_time || "10:00");
        setLunchroomCloseTime(data.close_time || json.close_time || "22:00");

        if (isBlocked) {
          setLunchroomBlockMsg(json.message || data.info || "Date is blocked. No table slots available.");
        } else if (isClosed) {
          setLunchroomBlockMsg(data.info || json.message || "Lunchroom is closed on this date.");
        }
      }
    } catch (e) {
      console.warn("Lunchroom slot check:", e);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (isLunchroom && reservationDate) {
      fetchLunchroomSlots(reservationDate);
    }
  }, [isLunchroom, reservationDate, fetchLunchroomSlots]);

  const handleContinue = () => {
    useBookingStore.setState({
      fullName,
      email,
      phone,
      specialRequests,
      date: isLunchroom ? reservationDate : storeState.date,
      timeSlot: isLunchroom ? timeSlot : storeState.timeSlot,
      guestsCount: isLunchroom ? lunchGuests : isActivity ? ticketCount : storeState.guestsCount,
      price: totalCalculated,
      isFree: isLunchroom,
      celebration: isLunchroom
        ? {
            isCelebrating,
            occasion: isCelebrating ? occasion : undefined,
            celebrantName: isCelebrating ? celebrantName : undefined,
            age: isCelebrating ? celebrantAge : undefined,
            hobbiesInterests: isCelebrating ? hobbies : undefined,
            otherDetails: isCelebrating ? otherCelebrationNotes : undefined,
          }
        : undefined,
    });
    router.push("/(bookings)/confirmation");
  };

  const isContinueDisabled = isLunchroom && (lunchroomIsBlocked || lunchroomIsClosed || !reservationDate || !timeSlot);

  return (
    <>
      <BackHeader />

      <Layout>
        <Header
          title={
            isLunchroom
              ? "Lunchroom Table Reservation"
              : isActivity
              ? "Activity & Guest Details"
              : t("createBooking.information.title") || "Contact Details"
          }
          subtitle={
            isLunchroom
              ? "Reserve your table with no deposit. Pay directly at the table."
              : isActivity
              ? "Select your participant tickets and verify reservation details"
              : t("createBooking.information.subtitle") || "Please confirm who the booking reservation is for"
          }
        />

        {/* ========================================================================= */}
        {/* LUNCHROOM TABLE RESERVATION CARD (IDENTICAL TO WEB LUNCHROOM FLOW)        */}
        {/* ========================================================================= */}
        {isLunchroom && (
          <View style={{ gap: 18, marginBottom: 18 }}>
            <Card style={styles.tableReservationCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <Text style={styles.tableCardHeading}>Table Reservation Details</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>Free Reservation</Text>
                </View>
              </View>

              {/* Operating Hours Banner / Status */}
              <View
                style={[
                  styles.hoursBanner,
                  (lunchroomIsBlocked || lunchroomIsClosed) && styles.hoursBannerBlocked,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Clock size={16} color={lunchroomIsBlocked || lunchroomIsClosed ? "#DC2626" : brownGold} />
                  {loadingSlots ? (
                    <Text style={{ fontSize: 12, color: brownGold, fontStyle: "italic" }}>
                      Checking table hours for {reservationDate}...
                    </Text>
                  ) : lunchroomIsBlocked || lunchroomIsClosed ? (
                    <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "700" }}>
                      {lunchroomBlockMsg || "Lunchroom is unavailable on this date."}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 12, color: brownGold, fontWeight: "600" }}>
                      Opening Hours: {lunchroomOpenTime} – {lunchroomCloseTime}
                    </Text>
                  )}
                </View>
                {!lunchroomIsBlocked && !lunchroomIsClosed && (
                  <View style={styles.walkinBadge}>
                    <Footprints size={12} color="#9B7C56" />
                    <Text style={styles.walkinBadgeText}>Walk-ins welcome</Text>
                  </View>
                )}
              </View>

              {/* Reservation Date Picker */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.fieldLabel}>Reservation Date *</Text>
                <Pressable
                  style={styles.pickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <CalendarIcon size={18} color={brownGold} />
                    <Text style={styles.pickerButtonText}>{reservationDate}</Text>
                  </View>
                  <View style={styles.changeBadge}>
                    <Text style={styles.changeBadgeText}>Change</Text>
                  </View>
                </Pressable>
              </View>

              {/* Calendar Modal */}
              <Modal
                visible={showDatePicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Table Reservation Date</Text>
                      <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={{ fontSize: 18, color: "#64748B", fontWeight: "700" }}>✕</Text>
                      </TouchableOpacity>
                    </View>

                    <Calendar
                      minDate={todayStr}
                      enableSwipeMonths
                      hideExtraDays
                      current={reservationDate}
                      markedDates={{
                        [reservationDate]: {
                          selected: true,
                          selectedColor: brownGold,
                          selectedTextColor: "#ffffff",
                        },
                      }}
                      onDayPress={(day) => {
                        if (day.dateString >= todayStr) {
                          setReservationDate(day.dateString);
                          setShowDatePicker(false);
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
                      }}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        borderWidth: 1,
                        borderColor: "#EBE3DA",
                      }}
                    />
                  </View>
                </View>
              </Modal>

              {/* Preferred Arrival Time Slots */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.fieldLabel}>Preferred Arrival Time *</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {generateTimeSlots(lunchroomOpenTime, lunchroomCloseTime, 60).map((tSlot) => {
                    const isSel = timeSlot === tSlot;
                    const isDisabled = lunchroomIsBlocked || lunchroomIsClosed;
                    return (
                      <Pressable
                        key={tSlot}
                        disabled={isDisabled}
                        style={[
                          styles.timeSlotPill,
                          isSel && styles.timeSlotPillActive,
                          isDisabled && { opacity: 0.4 },
                        ]}
                        onPress={() => setTimeSlot(tSlot)}
                      >
                        <Text style={[styles.timeSlotPillText, isSel && styles.timeSlotPillTextActive]}>
                          {tSlot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Number of Table Guests (1 to 10) */}
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.fieldLabel}>Number of Guests *</Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: brownGold }}>
                    {lunchGuests} {lunchGuests === 1 ? "Person" : "People"}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => {
                    const isSel = lunchGuests === num;
                    return (
                      <Pressable
                        key={num}
                        style={[
                          styles.ticketOption,
                          isSel && styles.ticketOptionActive,
                        ]}
                        onPress={() => setLunchGuests(num)}
                      >
                        <Text style={[styles.ticketNumber, isSel && styles.ticketNumberActive]}>
                          {num}
                        </Text>
                        <Text style={[styles.ticketSub, isSel && styles.ticketSubActive]}>
                          {num === 1 ? "Guest" : "Guests"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Card>

            {/* CELEBRATION DETAILS CARD (IDENTICAL TO WEB) */}
            <Card style={styles.celebrationCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <View style={styles.celebrationIconCircle}>
                    <Cake size={22} color={brownGold} />
                  </View>
                  <View>
                    <Text style={styles.celebrationTitle}>Are you celebrating something?</Text>
                    <Text style={styles.celebrationSub}>
                      Birthdays, anniversaries, or special milestones
                    </Text>
                  </View>
                </View>

                {/* Yes / No Toggle Button */}
                <View style={styles.togglePill}>
                  <Pressable
                    style={[styles.toggleBtn, isCelebrating && styles.toggleBtnActive]}
                    onPress={() => setIsCelebrating(true)}
                  >
                    <Text style={[styles.toggleBtnText, isCelebrating && styles.toggleBtnTextActive]}>
                      Yes
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.toggleBtn, !isCelebrating && styles.toggleBtnActive]}
                    onPress={() => setIsCelebrating(false)}
                  >
                    <Text style={[styles.toggleBtnText, !isCelebrating && styles.toggleBtnTextActive]}>
                      No
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Conditional Celebration Form */}
              {isCelebrating && (
                <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EBE3DA", gap: 12 }}>
                  <View style={styles.celebrationBanner}>
                    <Gift size={16} color={brownGold} />
                    <Text style={styles.celebrationBannerText}>
                      Tell us a bit about the occasion so we can prepare a warm, personalized table experience for your guest of honor!
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.fieldLabel}>What is being celebrated? *</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {OCCASIONS.map((occ) => {
                        const isSel = occasion === occ;
                        return (
                          <Pressable
                            key={occ}
                            style={[styles.occasionPill, isSel && styles.occasionPillActive]}
                            onPress={() => setOccasion(occ)}
                          >
                            <Text style={[styles.occasionPillText, isSel && styles.occasionPillTextActive]}>
                              {occ}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <Input
                    label="Who is it for? (Name of Celebrant) *"
                    placeholder="e.g. John / Mom / Alex"
                    variant="outline"
                    value={celebrantName}
                    onChangeText={setCelebrantName}
                  />

                  <Input
                    label="Age / Milestone (Optional)"
                    placeholder="e.g. 30th Birthday, 10th Anniversary"
                    variant="outline"
                    value={celebrantAge}
                    onChangeText={setCelebrantAge}
                  />

                  <Input
                    label="Hobbies / Personal Interests (Optional)"
                    placeholder="e.g. Nature lover, classical music, yoga..."
                    variant="outline"
                    value={hobbies}
                    onChangeText={setHobbies}
                  />

                  <Input
                    label="Other Celebration Details (Optional)"
                    placeholder="Any special surprise timing or dessert preferences"
                    variant="outline"
                    multiline
                    value={otherCelebrationNotes}
                    onChangeText={setOtherCelebrationNotes}
                  />
                </View>
              )}
            </Card>
          </View>
        )}

        {/* ========================================================================= */}
        {/* ACTIVITY SESSION SUMMARY CARD (IDENTICAL TO WEB INFORMATION FLOW)         */}
        {/* ========================================================================= */}
        {isActivity && act && (
          <Card style={styles.activitySessionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{act.category || "Class"}</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#059669" }}>
                ✓ Instant Confirmation
              </Text>
            </View>

            <Text style={styles.activityName}>{act.name}</Text>
            {act.description ? (
              <Text style={styles.activityDesc} numberOfLines={2}>
                {act.description}
              </Text>
            ) : null}

            {/* Schedule & Host Grid */}
            <View style={styles.activityMetaGrid}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Date & Schedule</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <CalendarIcon size={14} color={brownGold} />
                  <Text style={styles.metaValue}>
                    {act.date || storeState.date || "Scheduled Class"}
                  </Text>
                </View>
              </View>

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Time Slot</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <Clock size={14} color={brownGold} />
                  <Text style={styles.metaValue}>
                    {act.startTime} - {act.endTime}
                  </Text>
                </View>
              </View>

              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>Host / Guide</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <ShieldCheck size={14} color={brownGold} />
                  <Text style={styles.metaValue}>
                    {act.teacherHost || "Elena Rostova"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Number of Participants / Tickets Selection */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EBE3DA" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={styles.ticketsSectionTitle}>
                  Number of Tickets / Participants
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "700", color: brownGold }}>
                  €{singlePrice.toFixed(0)} / person
                </Text>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {Array.from({ length: Math.min(6, maxAllowedTickets) }, (_, i) => i + 1).map((num) => {
                  const isSel = ticketCount === num;
                  return (
                    <Pressable
                      key={num}
                      style={[
                        styles.ticketOption,
                        isSel && styles.ticketOptionActive,
                      ]}
                      onPress={() => setTicketCount(num)}
                    >
                      <Text style={[styles.ticketNumber, isSel && styles.ticketNumberActive]}>
                        {num}
                      </Text>
                      <Text style={[styles.ticketSub, isSel && styles.ticketSubActive]}>
                        {num === 1 ? "Ticket" : "Tickets"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Total Investment preview */}
              <View style={styles.investmentRow}>
                <Text style={styles.investmentLabel}>Total Activity Investment</Text>
                <Text style={styles.investmentAmount}>€{totalCalculated.toFixed(2)}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* PACKAGE MULTI-SERVICE SCHEDULE CARD (MATCHES WEB INFORMATION FLOW)        */}
        {/* ========================================================================= */}
        {(storeState.serviceType === "package" || storeState.serviceType === "packages") && storeState.packageSelections && (
          <Card style={styles.activitySessionCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>Package Reservation</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#059669" }}>
                ✓ Multi-Service Journey
              </Text>
            </View>

            <Text style={styles.activityName}>{storeState.serviceTitle}</Text>
            <Text style={[styles.activityDesc, { color: textMuted }]}>
              Scheduled components for {storeState.date} ({storeState.guestsCount} Guests)
            </Text>

            <View style={{ gap: 8, marginTop: 10 }}>
              {storeState.packageSelections.saunaSlot && (
                <View style={styles.packageDetailRow}>
                  <Text style={styles.packageDetailKey}>Sauna Session:</Text>
                  <Text style={styles.packageDetailVal}>
                    {storeState.packageSelections.saunaSlot.startTime} – {storeState.packageSelections.saunaSlot.endTime} ({storeState.packageSelections.saunaSlot.type || "Private"})
                  </Text>
                </View>
              )}
              {storeState.packageSelections.lunchroomTime && (
                <View style={styles.packageDetailRow}>
                  <Text style={styles.packageDetailKey}>Lunchroom Arrival:</Text>
                  <Text style={styles.packageDetailVal}>
                    {storeState.packageSelections.lunchroomTime}
                  </Text>
                </View>
              )}
              {storeState.packageSelections.saltRoomSlot && (
                <View style={styles.packageDetailRow}>
                  <Text style={styles.packageDetailKey}>Salt Room Session:</Text>
                  <Text style={styles.packageDetailVal}>
                    {storeState.packageSelections.saltRoomSlot.startTime} – {storeState.packageSelections.saltRoomSlot.endTime || ""}
                  </Text>
                </View>
              )}
              {storeState.packageSelections.activitySession && (
                <View style={styles.packageDetailRow}>
                  <Text style={styles.packageDetailKey}>Activity:</Text>
                  <Text style={styles.packageDetailVal}>
                    {storeState.packageSelections.activitySession.title} ({storeState.packageSelections.activitySession.startTime} – {storeState.packageSelections.activitySession.endTime})
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Contact Details Card */}
        <View style={styles.formCard}>
          <Text style={styles.tableCardHeading}>Contact & Guest Details</Text>
          <Input
            label={t("createBooking.information.labels.fullName") || "Full Name *"}
            placeholder={t("createBooking.information.placeholders.fullName") || "e.g. John Doe"}
            variant="outline"
            value={fullName}
            onChangeText={setFullName}
          />
          <Input
            label={t("createBooking.information.labels.email") || "Email Address *"}
            placeholder={t("createBooking.information.placeholders.email") || "name@example.com"}
            variant="outline"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label={t("createBooking.information.labels.phone") || "Phone Number *"}
            placeholder={t("createBooking.information.placeholders.phone") || "+31 6 12345678"}
            variant="outline"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Input
            label={t("createBooking.information.labels.specialRequests") || "Special Requests / Dietary Notes"}
            placeholder="Dietary requirements, seating preference, etc."
            variant="outline"
            multiline
            inputStyle={{ height: 80, textAlignVertical: "top" }}
            value={specialRequests}
            onChangeText={setSpecialRequests}
          />

          <AvoidKeyboard />
        </View>
      </Layout>

      <View style={[styles.footer, { borderTopColor: useColor("border") }]}>
        <Button onPress={handleContinue} disabled={isContinueDisabled}>
          <Text>
            {isLunchroom
              ? "Confirm Free Table Reservation"
              : t("createBooking.information.continue") || "Continue"}
          </Text>
          <ArrowRight size={18} />
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tableReservationCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
  },
  tableCardHeading: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  freeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#059669",
  },
  hoursBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  hoursBannerBlocked: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  walkinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  walkinBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9B7C56",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#9B7C56",
    backgroundColor: "#FAF6F1",
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1d1a17",
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#9B7C56",
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  timeSlotPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  timeSlotPillActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#9B7C56",
  },
  timeSlotPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  timeSlotPillTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  celebrationCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#FAF7F3",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
  },
  celebrationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#F9E4D0",
    justifyContent: "center",
    alignItems: "center",
  },
  celebrationTitle: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  celebrationSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  togglePill: {
    flexDirection: "row",
    backgroundColor: "#EDE7E1",
    padding: 3,
    borderRadius: 12,
  },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: "#9B7C56",
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  toggleBtnTextActive: {
    color: "#fff",
    fontWeight: "800",
  },
  celebrationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#E8E2DC",
  },
  celebrationBannerText: {
    fontSize: 12,
    color: "#9B7C56",
    fontWeight: "600",
    flex: 1,
  },
  occasionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  occasionPillActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#9B7C56",
  },
  occasionPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  occasionPillTextActive: {
    color: "#fff",
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
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EDE7E1",
    justifyContent: "center",
    alignItems: "center",
  },
  formCard: {
    gap: 16,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  activitySessionCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#FAF7F3",
    borderWidth: 1.5,
    borderColor: "#EBE3DA",
    marginBottom: 20,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(155, 124, 86, 0.12)",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9B7C56",
    textTransform: "uppercase",
  },
  activityName: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
    marginTop: 8,
  },
  activityDesc: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginTop: 4,
  },
  activityMetaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EBE3DA",
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9B7C56",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d1a17",
  },
  ticketsSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1d1a17",
    fontFamily: Fonts.serif,
  },
  ticketOption: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  ticketOptionActive: {
    backgroundColor: "#9B7C56",
    borderColor: "#9B7C56",
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#1d1a17",
  },
  ticketNumberActive: {
    color: "#fff",
  },
  ticketSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  ticketSubActive: {
    color: "rgba(255,255,255,0.9)",
  },
  investmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#F9E4D0",
  },
  investmentLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9B7C56",
    textTransform: "uppercase",
  },
  investmentAmount: {
    fontSize: 20,
    fontWeight: "800",
    fontFamily: Fonts.serif,
    color: "#9B7C56",
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
  packageDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  packageDetailKey: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  packageDetailVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1d1a17",
  },
});
