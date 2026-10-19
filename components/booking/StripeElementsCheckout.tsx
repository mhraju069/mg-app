import React, { useState } from "react";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/utils/stripe";
import {
  Lock,
  CreditCard,
  Sparkles,
  Building,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react-native";
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ActivityIndicator } from "react-native";

export const IDEAL_BANKS = [
  { id: "ing", name: "ING Bank" },
  { id: "rabobank", name: "Rabobank" },
  { id: "abn_amro", name: "ABN AMRO" },
  { id: "sns_bank", name: "SNS Bank" },
  { id: "asn_bank", name: "ASN Bank" },
  { id: "regiobank", name: "RegioBank" },
  { id: "triodos_bank", name: "Triodos Bank" },
  { id: "bunq", name: "bunq" },
  { id: "revolut", name: "Revolut" },
  { id: "knab", name: "Knab" },
  { id: "n26", name: "N26" },
];

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      color: "#0F172A",
      "::placeholder": {
        color: "#94A3B8",
      },
    },
    invalid: {
      color: "#EF4444",
      iconColor: "#EF4444",
    },
  },
};

interface StripeElementsCheckoutProps {
  cardHolder: string;
  setCardHolder: (name: string) => void;
  postalCode: string;
  setPostalCode: (zip: string) => void;
  paymentMethod: "card" | "ideal";
  setPaymentMethod: (m: "card" | "ideal") => void;
  selectedBank: string;
  setSelectedBank: (b: string) => void;
  errorMessage: string | null;
  onElementsReady?: (elements: any, stripe: any) => void;
}

function InnerStripeElementsCheckout({
  cardHolder,
  setCardHolder,
  postalCode,
  setPostalCode,
  paymentMethod,
  setPaymentMethod,
  selectedBank,
  setSelectedBank,
  errorMessage,
  onElementsReady,
}: StripeElementsCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();

  React.useEffect(() => {
    if (elements && stripe && onElementsReady) {
      onElementsReady(elements, stripe);
    }
  }, [elements, stripe, onElementsReady]);

  return (
    <View style={styles.container}>
      {/* Stripe Security Header */}
      <View style={styles.stripeHeader}>
        <View style={styles.stripeBadge}>
          <Lock size={14} color="#fff" />
          <Text style={styles.stripeBadgeText}>STRIPE OFFICIAL ELEMENTS</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={16} color="#059669" />
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#059669" }}>
            PCI-DSS 256-Bit SSL
          </Text>
        </View>
      </View>

      {/* Payment Method Switcher */}
      <View style={styles.methodToggle}>
        <Pressable
          style={[
            styles.methodBtn,
            paymentMethod === "card" && styles.methodBtnActive,
          ]}
          onPress={() => setPaymentMethod("card")}
        >
          <CreditCard size={18} color={paymentMethod === "card" ? "#fff" : "#64748B"} />
          <Text
            style={[
              styles.methodBtnText,
              paymentMethod === "card" && styles.methodBtnTextActive,
            ]}
          >
            Credit / Debit Card
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.methodBtn,
            paymentMethod === "ideal" && styles.methodBtnActive,
          ]}
          onPress={() => setPaymentMethod("ideal")}
        >
          <Sparkles size={18} color={paymentMethod === "ideal" ? "#fff" : "#64748B"} />
          <Text
            style={[
              styles.methodBtnText,
              paymentMethod === "ideal" && styles.methodBtnTextActive,
            ]}
          >
            iDEAL Banking
          </Text>
        </Pressable>
      </View>

      {paymentMethod === "card" ? (
        <View style={{ gap: 14 }}>
          {/* Cardholder Name */}
          <View>
            <Text style={styles.inputLabel}>Name on Card</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. John Doe"
              placeholderTextColor="#94A3B8"
              value={cardHolder}
              onChangeText={setCardHolder}
            />
          </View>

          {/* Stripe Card Number Element */}
          <View>
            <Text style={styles.inputLabel}>Card Number</Text>
            <View style={styles.stripeElementWrapper}>
              {Platform.OS === "web" ? (
                <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
              ) : (
                <TextInput
                  style={{ fontSize: 14, color: "#0F172A" }}
                  placeholder="4242 4242 4242 4242"
                  placeholderTextColor="#94A3B8"
                />
              )}
            </View>
          </View>

          {/* Expiry, CVC & Zip */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Expires (MM/YY)</Text>
              <View style={styles.stripeElementWrapper}>
                {Platform.OS === "web" ? (
                  <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                ) : (
                  <TextInput
                    style={{ fontSize: 14, color: "#0F172A" }}
                    placeholder="MM/YY"
                    placeholderTextColor="#94A3B8"
                  />
                )}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CVC / CVV</Text>
              <View style={styles.stripeElementWrapper}>
                {Platform.OS === "web" ? (
                  <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                ) : (
                  <TextInput
                    style={{ fontSize: 14, color: "#0F172A" }}
                    placeholder="123"
                    placeholderTextColor="#94A3B8"
                  />
                )}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Postal Code</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1012 AB"
                placeholderTextColor="#94A3B8"
                value={postalCode}
                onChangeText={setPostalCode}
              />
            </View>
          </View>

          <View style={styles.testCardNotice}>
            <ShieldCheck size={14} color="#9B7C56" />
            <Text style={styles.testCardNoticeText}>
              Stripe Elements active • Accepts all real cards & test cards (4242 4242...)
            </Text>
          </View>
        </View>
      ) : (
        /* iDEAL Dutch Bank selector */
        <View style={{ gap: 10 }}>
          <Text style={styles.inputLabel}>Select Your Dutch Bank</Text>
          <View style={styles.bankGrid}>
            {IDEAL_BANKS.map((bank) => {
              const isSelected = selectedBank === bank.id;
              return (
                <Pressable
                  key={bank.id}
                  style={[
                    styles.bankItem,
                    isSelected && styles.bankItemActive,
                  ]}
                  onPress={() => setSelectedBank(bank.id)}
                >
                  <Building size={16} color={isSelected ? "#9B7C56" : "#64748B"} />
                  <Text
                    style={[
                      styles.bankItemText,
                      isSelected && styles.bankItemTextActive,
                    ]}
                  >
                    {bank.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={{ fontSize: 12, color: "#64748B", fontStyle: "italic", marginTop: 4 }}>
            You will be redirected securely to your bank to authorize the iDEAL transaction.
          </Text>
        </View>
      )}

      {errorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color="#DC2626" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function StripeElementsCheckout(props: StripeElementsCheckoutProps) {
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise}>
      <InnerStripeElementsCheckout {...props} />
    </Elements>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  stripeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stripeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#9B7C56",
  },
  stripeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  methodToggle: {
    flexDirection: "row",
    backgroundColor: "#F8F5F2",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  methodBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  methodBtnActive: {
    backgroundColor: "#9B7C56",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  methodBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  methodBtnTextActive: {
    color: "#fff",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3D2E24",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1d1a17",
    fontWeight: "500",
  },
  stripeElementWrapper: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  testCardNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FCF2E9",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  testCardNoticeText: {
    fontSize: 11,
    color: "#8B7355",
    fontWeight: "600",
    flex: 1,
  },
  bankGrid: {
    gap: 8,
  },
  bankItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FDFBF8",
    borderWidth: 1,
    borderColor: "#EBE3DA",
  },
  bankItemActive: {
    borderColor: "#9B7C56",
    backgroundColor: "#FCF2E9",
  },
  bankItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  bankItemTextActive: {
    color: "#1d1a17",
    fontWeight: "700",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: {
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "600",
    flex: 1,
  },
});
