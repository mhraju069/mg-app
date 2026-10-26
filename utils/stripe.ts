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

/**
 * Direct Stripe PaymentIntent confirmation for mobile platforms (iOS & Android).
 * Interacts directly with Stripe's REST API without requiring web DOM or external native binaries.
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

    // Clean up inputs
    const cleanNumber = cardNumber.replace(/\D/g, "");
    const parts = cardExpiry.split("/");
    const expMonth = parts[0]?.trim();
    const expYear = parts[1]?.trim() ? (parts[1].trim().length === 2 ? `20${parts[1].trim()}` : parts[1].trim()) : "";

    if (!cleanNumber || cleanNumber.length < 15) {
      return { success: false, error: "Please enter a valid card number." };
    }
    if (!expMonth || !expYear) {
      return { success: false, error: "Please enter a valid expiration date (MM/YY)." };
    }
    if (!cardCvc || cardCvc.length < 3) {
      return { success: false, error: "Please enter a valid CVC / CVV code." };
    }

    // 1. Create PaymentMethod directly via Stripe REST API
    const pmBody = new URLSearchParams();
    pmBody.append("type", "card");
    pmBody.append("card[number]", cleanNumber);
    pmBody.append("card[exp_month]", expMonth);
    pmBody.append("card[exp_year]", expYear);
    pmBody.append("card[cvc]", cardCvc);
    if (cardHolder) {
      pmBody.append("billing_details[name]", cardHolder);
    }
    if (email) {
      pmBody.append("billing_details[email]", email);
    }
    if (postalCode) {
      pmBody.append("billing_details[address][postal_code]", postalCode);
    }

    const pmResponse = await fetch("https://api.stripe.com/v1/payment_methods", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: pmBody.toString(),
    });

    const pmData = await pmResponse.json();
    if (!pmResponse.ok || pmData.error) {
      return { success: false, error: pmData.error?.message || "Failed to validate card details with Stripe." };
    }

    const paymentMethodId = pmData.id;

    // 2. Extract payment intent ID from client_secret (e.g. pi_3xxx_secret_yyy -> pi_3xxx)
    const piId = clientSecret.split("_secret_")[0];
    if (!piId) {
      return { success: false, error: "Invalid payment intent client secret." };
    }

    // 3. Confirm PaymentIntent using the newly created PaymentMethod
    const confirmBody = new URLSearchParams();
    confirmBody.append("payment_method", paymentMethodId);
    confirmBody.append("client_secret", clientSecret);

    const confirmResponse = await fetch(`https://api.stripe.com/v1/payment_intents/${piId}/confirm`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: confirmBody.toString(),
    });

    const confirmData = await confirmResponse.json();
    if (!confirmResponse.ok || confirmData.error) {
      return { success: false, error: confirmData.error?.message || "Card transaction was declined by Stripe." };
    }

    return {
      success: true,
      paymentIntent: confirmData,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error while connecting to Stripe payment gateway.",
    };
  }
}

export default getStripe;
