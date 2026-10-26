import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Platform } from "react-native";

let stripePromise: Promise<Stripe | null>;

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51Sct9QEe7PW0Rd5ukroDxzhTAigDjXRxIxM16xcZMyKA62XxoPnckZnh7cLHAEKFDI4nNGKMV9YpdcMmFzuBBoFr00KbAXg8kc";

export const getStripe = async (): Promise<Stripe | null> => {
  if (Platform.OS !== "web") {
    return null;
  }
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  return "https://api.heaven-on-earth.nl";
};

/**
 * Native mobile card payment confirmation — proxied through our backend.
 *
 * Stripe now blocks direct publishable-key REST tokenization from mobile clients
 * (error: "This integration surface is unsupported for publishable key tokenization").
 *
 * Instead, we send the raw card details to our own backend endpoint which:
 *  1. Creates a PaymentMethod using the Stripe Secret Key (server-side)
 *  2. Confirms the PaymentIntent against the provided client_secret
 *  3. Returns the result to the app
 *
 * Backend endpoint: POST /api/payments/confirm-native/
 * Expected payload: { client_secret, card_number, exp_month, exp_year, cvc, card_holder, postal_code?, email? }
 */
export async function confirmStripeNativePayment(params: {
  clientSecret: string;
  cardNumber: string;
  cardExpiry: string; // "MM/YY"
  cardCvc: string;
  cardHolder: string;
  postalCode?: string;
  email?: string;
}): Promise<{ success: boolean; paymentIntent?: any; error?: string }> {
  try {
    const { clientSecret, cardNumber, cardExpiry, cardCvc, cardHolder, postalCode, email } = params;

    // Clean up card number input
    const cleanNumber = cardNumber.replace(/\D/g, "");
    const parts = cardExpiry.split("/");
    const expMonth = parts[0]?.trim();
    const rawYear = parts[1]?.trim() || "";
    const expYear = rawYear.length === 2 ? `20${rawYear}` : rawYear;

    // Client-side validation before hitting backend
    if (!cleanNumber || cleanNumber.length < 15) {
      return { success: false, error: "Please enter a valid card number." };
    }
    if (!expMonth || !expYear || expMonth.length > 2 || expYear.length < 4) {
      return { success: false, error: "Please enter a valid expiration date (MM/YY)." };
    }
    if (!cardCvc || cardCvc.length < 3) {
      return { success: false, error: "Please enter a valid CVC / CVV code." };
    }
    if (!clientSecret) {
      return { success: false, error: "Invalid payment session. Please restart the checkout." };
    }

    // Send card details to our backend, which uses the Stripe Secret Key to create
    // the PaymentMethod and confirm the PaymentIntent server-side.
    const response = await fetch(`${getApiBaseUrl()}/api/payments/confirm-native/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_secret: clientSecret,
        card_number: cleanNumber,
        exp_month: parseInt(expMonth, 10),
        exp_year: parseInt(expYear, 10),
        cvc: cardCvc,
        card_holder: cardHolder || "Guest",
        postal_code: postalCode || undefined,
        email: email || undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg =
        data?.error ||
        data?.message ||
        data?.detail ||
        `Server returned ${response.status} ${response.statusText || ""}. Please ensure the payment service is updated.`;
      return { success: false, error: errMsg };
    }

    if (data?.success === false || data?.error) {
      return {
        success: false,
        error: data?.error || data?.message || "Card transaction was declined.",
      };
    }

    return {
      success: true,
      paymentIntent: data?.payment_intent || data,
    };
  } catch (err: any) {
    // Network / connection error
    const msg = err?.message || "";
    if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
      return {
        success: false,
        error: "Network error: Could not connect to payment server. Please check your internet connection.",
      };
    }
    return {
      success: false,
      error: msg || "An unexpected error occurred during payment processing.",
    };
  }
}

export default getStripe;
