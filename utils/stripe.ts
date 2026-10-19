import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51Sct9QEe7PW0Rd5ukroDxzhTAigDjXRxIxM16xcZMyKA62XxoPnckZnh7cLHAEKFDI4nNGKMV9YpdcMmFzuBBoFr00KbAXg8kc";

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export default getStripe;
