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
 * Mobile payments are now handled through the official @stripe/stripe-react-native SDK
 * via the `useStripePayment` hook and <CardField /> component to comply with PCI-DSS
 * standards and avoid raw card data transmission.
 */
export default getStripe;

